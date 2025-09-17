// NOTE: This file is import-sensitive, circular dependencies might crash the app!
import proxyLazy from "./proxyLazy";

export * as common from "./common";

import { Nullish } from "./types"

declare const modules: Record<number, any>;
export const factoryCallbacks = new Set<(exports: any) => void>();

export let _resolveReady: () => void;
export const onceReady = new Promise(resolve => _resolveReady = <any>resolve);

export type FilterFn = (mod: any) => boolean;

function isInvalidExport(exports: any) {
    return (
        exports == null
        || exports === globalThis
        || typeof exports === "boolean"
        || typeof exports === "number"
        || typeof exports === "string"
        || exports["whar???"] === null
    );
}

function blacklist(id: number) {
    Object.defineProperty(modules, id, {
        value: modules[id],
        enumerable: false,
        configurable: true,
        writable: true
    });
}

function getTurboModule(name: string): any {
    if (typeof globalThis.__turboModuleProxy === "function") {
        try {
            return globalThis.__turboModuleProxy(name);
        } catch {
            return undefined;
        }
    }
    return undefined;
}

export const filters = {
    byProps: (...props: string[]) => (exp: any) => props.length === 1 ? exp[props[0]] != null : props.every(prop => exp?.[prop] != null),
    byName: (name: string, deExp = true) => (exp: any) => (deExp ? exp.name : exp.default?.name) === name,
    byDisplayName: (displayName: string, deExp = true) => (exp: any) => (deExp ? exp.displayName : exp.default?.displayName) === displayName,
    byStoreName: (storeName: string, deExp = true) => (exp: any) => exp._dispatcher && (deExp ? exp : exp.default)?.getName?.() === storeName,
};

/**
 * @private
 * Called during the initialization of a module.
 * Patches the module factory to emit an event when the module is loaded.
 */
export function initMetro() {

    if (typeof globalThis.__turboModuleProxy === "function") {
        const turboModuleNames = [
            "UIManager",
            "DeviceInfo",
        ];

        for (const name of turboModuleNames) {
            try {
                const turboModule = globalThis.__turboModuleProxy(name);
                if (turboModule) {
                    factoryCallbacks.forEach(cb => cb(turboModule));
                }
            } catch {
                // It didnt return anything, so instead  of failing we just let it die peacefully
            }
        }
    }

    waitForModule(
        ["dispatch", "_actionHandlers"],
        FluxDispatcher => {
            const cb = () => {
                _resolveReady();
                FluxDispatcher.unsubscribe("CONNECTION_OPEN", cb);
            };
            FluxDispatcher.subscribe("CONNECTION_OPEN", cb);
        }
    );
}

/**
 * Get all the modules that are already initialized.
 * @returns An iterable of the modules
 * @example for (const m of getInititializedModules()) { console.log(m.exports) }
 */
export function* getInitializedModules(): IterableIterator<any> {
    for (const id in modules) {
        if (modules[id].isInitialized) {
            if (isInvalidExport(modules[id].publicModule.exports)) {
                blacklist(id as unknown as number);
                continue;
            }

            yield modules[id].publicModule;
        }3
    }
}

/**
 * Wait for a module to be loaded, then call a callback with the module exports.
 * @param {(m) => boolean} filter
 * @param {(exports) => void} callback
*/
export function waitForModule(filter: string | string[] | FilterFn, callback: (exports: any) => void) {
    if (typeof filter !== "function") {
        filter = Array.isArray(filter) ? filters.byProps(...filter) : filters.byProps(filter);
    }

    const find = findInitializedModule(filter as FilterFn);
    if (find) return (callback(find), () => { });

    const matches = (exports: any) => {
        if (exports.default && exports.__esModule && (filter as FilterFn)(exports.default)) {
            factoryCallbacks.delete(matches);
            callback(exports.default);
        }

        if ((filter as FilterFn)(exports)) {
            factoryCallbacks.delete(matches);
            callback(exports);
        }
    };

    factoryCallbacks.add(matches);
    return () => factoryCallbacks.delete(matches);
}

/**
 * Synchronously get an already loaded/initialized module.
 * @param filter A function that returns true if the module is the one we're looking for
 * @param returnDefault Whether to return the default export or the module itself
 * @returns Returns the module exports
 */
export function findInitializedModule(filter: (m: any) => boolean, returnDefault = true): any {
    if (typeof filter === "function" && filter.name) {
        const turbo = getTurboModule(filter.name);
        if (turbo) return turbo;
    }
}

/**
 * Same as findInitializedModule, but lazy.
 * @param filter A function that returns true if the module is the one we're looking for
 * @param returnDefault Whether to return the default export or the module itself
 * @returns A proxy that will return the module exports when a property is accessed
 */
export function findLazy(filter: (m: any) => boolean, returnDefault = true): any {
    return proxyLazy(() => findInitializedModule(filter, returnDefault));
}

/**
 * Find an initialized module by its props.
 * @param {string[]} props Props of the module to look for
 * @returns The module's export
 */
export function findByProps(...props: string[]) {
    return findInitializedModule(filters.byProps(...props));
}

/**
 * Same as findByProps, but lazy.
 */
export function findByPropsLazy(...props: string[]) {
    return proxyLazy(() => findByProps(...props));
}

/**
 * Get an already loaded module by its [function] name.
 * @param {string} name The module's name
 * @param {boolean} defaultExport Whether to return the default export or the module itself
 * @returns The function's exports
 */
export function findByName(name: string, defaultExport: boolean = true) {
    return findInitializedModule(filters.byName(name), defaultExport);
}

/**
 * Same as findByName, but lazy.
 */
export function findByNameLazy(name: string, defaultExport: boolean = true) {
    return proxyLazy(() => findByName(name, defaultExport));
}

/**
 * Find an initialized module (usually class components) by its display name.
 * @param {string} displayName The component's display name
 * @param {boolean} defaultExport Export the default export or the module itself
 * @returns The component's exports
*/
export function findByDisplayName(displayName: string, defaultExport: boolean = true) {
    return findInitializedModule(filters.byDisplayName(displayName), defaultExport);
}

/**
 * Same as findByDisplayName, but lazy.
 */
export function findByDisplayNameLazy(displayName: string, defaultExport = true) {
    return proxyLazy(() => findByDisplayName(displayName, defaultExport));
}

/**
 * Synchonously get an already loaded Flux store.\
 * /!\ Only works if the store is already loaded, hence inconsistent.
 * @param {string} storeName The Flux store name
 * @returns The Flux store
*/
export function findByStoreName(storeName: string) {
    return findInitializedModule(filters.byStoreName(storeName));
}

/**
 * Same as findByStoreName, but lazy.
 */
export function findByStoreNameLazy(storeName: string) {
    return proxyLazy(() => findByStoreName(storeName));
}

export namespace Metro {
    export type DependencyMap = Array<ModuleID> & {
        readonly paths?: Readonly<Record<ModuleID, string>> | undefined;
    };

    /** Only available on Discord's development environment, will never be defined on release builds */
    export type InverseDependencyMap = Record<ModuleID, ModuleID[]>;

    export type FactoryFn = (
        global: object,
        require: RequireFn,
        metroImportDefault: RequireFn,
        metroImportAll: RequireFn,
        moduleObject: {
            exports: any;
        },
        exports: any,
        dependencyMap: DependencyMap | Nullish,
    ) => void;

    /** Only available on Discord's development environment, will never be defined on release builds */
    export interface HotModuleReloadingData {
        _acceptCallback: (() => void) | Nullish;
        _disposeCallback: (() => void) | Nullish;
        _didAccept: boolean;
        accept: (callback?: (() => void) | undefined) => void;
        dispose: (callback?: (() => void) | undefined) => void;
    }

    export type ModuleID = number;

    export interface Module {
        id?: ModuleID | undefined;
        exports: any;
        hot?: HotModuleReloadingData | undefined;
    }

    export interface ModuleDefinition {
        /** Set to undefined once module is initialized */
        dependencyMap: DependencyMap | Nullish;
        /** Error.value thrown by the factory */
        error?: any;
        /** Set to undefined once module is initialized */
        factory: FactoryFn | undefined;
        /**
         * If factory thrown any error
         * */
        hasError: boolean;
        /**
         * Only available on Discord's development environment, will never be defined on release builds
         * */
        hot?: HotModuleReloadingData | undefined;
        /**
         * Cached `import *` imports in Metro, always an empty object as Bunny prevents outdated import cache
         * */
        importedAll: any;
        /**
         * Cached `import module from "./module"` imports in Metro, always an empty object as Bunny prevents outdated import cache
         * */
        importedDefault: any;
        /**
         * Whether factory has been successfully called
         * */
        isInitialized: boolean;
        /**
         * Only available on Discord's development environment, will never be defined on release builds
         * */
        path?: string | undefined;
        /**
         * Acts as CJS module in the bundler
         * */
        publicModule: Module;
        /**
         * Only available on Discord's development environment, will never be defined on release builds
         * */
        verboseName?: string | undefined;

        /**
         * This is set by us. Should be available for all Discord's tsx modules!
         */
        __filePath?: string;
    }

    export type ModuleList = Record<ModuleID, ModuleDefinition | Nullish>;

    export type RequireFn = (id: ModuleID) => any;

    export type DefineFn = (
        factory: FactoryFn,
        moduleId: ModuleID,
        dependencyMap?: DependencyMap | undefined,
        /** Only available on Discord's development environment, will never be defined on release builds */
        verboseName?: string | undefined,
        /** Only available on Discord's development environment, will never be defined on release builds */
        inverseDependencies?: InverseDependencyMap | undefined
    ) => void;

    export type ModuleDefiner = (moduleId: ModuleID) => void;

    export type ClearFn = () => ModuleList;

    export type RegisterSegmentFn = (
        segmentId: number,
        moduleDefiner: ModuleDefiner,
        moduleIds: Readonly<ModuleID[]> | Nullish
    ) => void;

    export interface Require extends RequireFn {
        importDefault: RequireFn;
        importAll: RequireFn;
        /** @throws {Error} A macro, will always throws an error at runtime */
        context: () => never;
        /** @throws {Error} A macro, will always throws an error at runtime */
        resolveWeak: () => never;
        unpackModuleId: (moduleId: ModuleID) => {
            localId: number;
            segmentId: number;
        };
        packModuleId: (value: {
            localId: number;
            segmentId: number;
        }) => ModuleID;
    }
}