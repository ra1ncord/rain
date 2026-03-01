import { getMetroCache, indexBlacklistFlag, indexExportsFlags } from "@metro/internals/caches";
import { Metro } from "@metro/types";

import { ModuleFlags, ModulesMapInternal } from "./enums";

const { before, instead } = require("sublimation");

export const metroModules: Metro.ModuleList = window.modules;
const metroRequire = (id: string | number) => window.__r(+id);

const moduleSubscriptions = new Map<number, Set<() => void>>();
const blacklistedIds = new Set<number>();
const noopHandler = () => undefined;
const functionToString = Function.prototype.toString;

let patchedInspectSource = false;
let patchedImportTracker = false;
let patchedNativeComponentRegistry = false;
let _importingModuleId: number = -1;

const BAD_EXPORTS_CHECK_STRING = "<!@ this string is very bad! @>";

const moduleKeys = Object.keys(metroModules);

for (const key of moduleKeys) {
    const id = Number(key);
    const metroModule = metroModules[id];

    const cache = getMetroCache().flagsIndex[id];
    if (cache & ModuleFlags.BLACKLISTED) {
        blacklistModule(id);
        continue;
    }

    if (metroModule!.factory) {
        instead("factory", metroModule, ((args: Parameters<Metro.FactoryFn>, origFunc: Metro.FactoryFn) => {
            const originalImportingId = _importingModuleId;
            _importingModuleId = id;

            const { 1: metroRequire, 4: moduleObject } = args;

            args[2 /* metroImportDefault */] = id => {
                const exps = metroRequire(id);
                return exps && exps.__esModule ? exps.default : exps;
            };

            args[3 /* metroImportAll */] = id => {
                const exps = metroRequire(id);
                if (exps && exps.__esModule) return exps;

                // This isnt as safe as before but themes+ is more important imo
                if (exps) exps.default = exps;
                return exps;
            };

            origFunc(...args);
            if (!isBadExports(moduleObject.exports)) {
                onModuleRequire(moduleObject.exports, id);
            } else {
                blacklistModule(id);
            }

            _importingModuleId = originalImportingId;
        }) as any);
    }
}

function blacklistModule(id: number) {
    Object.defineProperty(metroModules, id, { enumerable: false });
    blacklistedIds.add(id);
    indexBlacklistFlag(Number(id));
}

function isBadExports(exports: any) {
    if (!exports) return true;

    if (exports === window) return true;

    if (exports[BAD_EXPORTS_CHECK_STRING] === null) return true;

    if (exports.__proto__ === Object.prototype) {
        if (Reflect.ownKeys(exports).length === 0) return true;
    }

    return exports.default?.[Symbol.toStringTag] === "IntlMessagesProxy";
}

function onModuleRequire(moduleExports: any, id: Metro.ModuleID) {
    indexExportsFlags(id, moduleExports);

    // Temporary fixes
    moduleExports.initSentry &&= () => undefined;
    if (moduleExports.default?.track && moduleExports.default.trackMaker)
        moduleExports.default.track = () => Promise.resolve();

    if (moduleExports.registerAsset) {
        require("@api/assets/patches").patchAssets(moduleExports);
    }

    if (!patchedNativeComponentRegistry && ["customBubblingEventTypes", "customDirectEventTypes", "register", "get"].every(x => moduleExports[x])) {
        instead("register", moduleExports, ([name, cb]: any, origFunc: any) => {
            try {
                return origFunc(name, cb);
            } catch {
                return name;
            }
        });

        patchedNativeComponentRegistry = true;
    }

    if (moduleExports?.default?.constructor?.displayName === "DeveloperExperimentStore") {
        moduleExports.default = new Proxy(moduleExports.default, {
            get(target, property, receiver) {
                return Reflect.get(target, property, receiver);
            }
        });
    }

    if (!patchedImportTracker && moduleExports.fileFinishedImporting) {
        before("fileFinishedImporting", moduleExports, ([filePath]: [string]) => {
            if (_importingModuleId === -1 || !filePath) return;
            metroModules[_importingModuleId]!.__filePath = filePath;
        });
        patchedImportTracker = true;
    }

    if (!patchedInspectSource && window["__core-js_shared__"]) {
        const inspect = (f: unknown) => typeof f === "function" && functionToString.apply(f, []);
        window["__core-js_shared__"].inspectSource = inspect;
        patchedInspectSource = true;
    }

    if (moduleExports.findHostInstance_DEPRECATED) {
        const prevExports = metroModules[id - 1]?.publicModule.exports;
        const inc = prevExports.default?.reactProfilingEnabled ? 1 : -1;
        if (!metroModules[id + inc]?.isInitialized) {
            blacklistModule(id + inc);
        }
    }

    if (moduleExports.isMoment) {
        instead("defineLocale", moduleExports, (args: [string], orig: (lcl: string) => string) => {
            const origLocale = moduleExports.locale();
            orig(...args);
            moduleExports.locale(origLocale);
        });
    }

    const subs = moduleSubscriptions.get(Number(id));
    if (subs) {
        subs.forEach(s => s());
        moduleSubscriptions.delete(Number(id));
    }
}

export function getImportingModuleId() {
    return _importingModuleId;
}

export function subscribeModule(id: number, cb: () => void): () => void {
    const subs = moduleSubscriptions.get(id) ?? new Set();

    subs.add(cb);
    moduleSubscriptions.set(id, subs);

    return () => subs.delete(cb);
}

export function requireModule(id: Metro.ModuleID) {
    if (blacklistedIds.has(id)) return undefined;

    if (!metroModules[0]?.isInitialized) metroRequire(0);

    if (Number(id) === -1) return require("@metro/polyfills/redesign");

    const module = metroModules[id];
    if (module?.isInitialized && !module.hasError) {
        return metroRequire(id);
    }

    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(noopHandler);

    let moduleExports;
    try {
        moduleExports = metroRequire(id);
    } catch {
        blacklistModule(id);
        moduleExports = undefined;
    }

    ErrorUtils.setGlobalHandler(originalHandler);

    return moduleExports;
}

export function* getModules(uniq: string, all = false) {
    yield [-1, require("@metro/polyfills/redesign")];

    const cache = getMetroCache().findIndex[uniq];

    if (cache?.[`_${ModulesMapInternal.NOT_FOUND}`]) return;

    const useCache = cache && (!all || cache[`_${ModulesMapInternal.FULL_LOOKUP}`]);

    if (useCache) {
        for (const id in cache) {
            if (id[0] === "_") continue;
            const exports = requireModule(Number(id));
            if (isBadExports(exports)) continue;
            yield [id, exports];
        }
    }

    for (const id of moduleKeys) {
        if (useCache && cache![id]) continue;

        const exports = requireModule(Number(id));
        if (isBadExports(exports)) continue;
        yield [id, exports];
    }
}

export function* getCachedPolyfillModules(name: string) {
    const cache = getMetroCache().polyfillIndex[name];
    if (!cache) return;

    const fullLookup = cache[`_${ModulesMapInternal.FULL_LOOKUP}`];

    for (const id in cache) {
        if (id[0] === "_") continue;
        const exports = requireModule(Number(id));
        if (isBadExports(exports)) continue;
        yield [id, exports];
    }

    if (!fullLookup) {
        for (const id of moduleKeys) {
            if (cache[id]) continue;

            const exports = requireModule(Number(id));
            if (isBadExports(exports)) continue;
            yield [id, exports];
        }
    }
}

export interface WaitForOptions {
    count?: number;
}

export type ModuleFilter<T = any> = {
    (exports: any): T | undefined;
    key?: string;
}

export function waitFor<T = any>(
    filter: ModuleFilter<T>,
    callback: (exports: T, id: Metro.ModuleID) => void,
    options: WaitForOptions = {}
): () => void {
    const { count = 1 } = options;
    let currentCount = 0;
    const unsubscribers: Array<() => void> = [];
    let isActive = true;

    const cleanup = () => {
        if (!isActive) return;
        isActive = false;
        unsubscribers.forEach(unsub => unsub());
        unsubscribers.length = 0;
    };

    function checkModule(id: Metro.ModuleID): boolean {
        if (!isActive) return true;

        const exports = requireModule(id);
        if (isBadExports(exports)) return false;

        const result = filter(exports);
        if (!result) return false;

        callback(result, id);

        if (++currentCount >= count) {
            cleanup();
            return true;
        }

        return false;
    }

    if (filter.key) {
        const cache = getMetroCache().findIndex[filter.key];
        if (cache) {
            const cachedCount = Object.keys(cache).filter(k => k[0] !== "_").length;

            if (cachedCount >= count) {
                for (const id in cache) {
                    if (id[0] === "_") continue;
                    const numId = Number(id);

                    if (metroModules[numId]?.isInitialized) {
                        if (checkModule(numId)) return cleanup;
                    } else {
                        const unsub = subscribeModule(numId, () => {
                            checkModule(numId);
                        });
                        unsubscribers.push(unsub);
                    }

                    if (!isActive) return cleanup;
                }
            }
        }
    }

    if (isActive) {
        for (const id of moduleKeys) {
            if (!isActive) break;
            const numId = Number(id);

            if (metroModules[numId]?.isInitialized && !metroModules[numId]?.hasError) {
                if (checkModule(numId)) return cleanup;
            }
        }
    }

    if (isActive) {
        for (const id of moduleKeys) {
            const numId = Number(id);
            if (!metroModules[numId]?.isInitialized) {
                const unsub = subscribeModule(numId, () => {
                    checkModule(numId);
                });
                unsubscribers.push(unsub);
            }
        }
    }

    return cleanup;
}

export function waitForModule<T = any>(
    filter: ModuleFilter<T>,
    options: WaitForOptions = {}
): Promise<T> {
    return new Promise(resolve => {
        waitFor(filter, exports => resolve(exports), options);
    });
}
