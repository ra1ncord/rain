import type { Metro } from "@metro/types";
import { initPlugins } from "@plugins";
const { instead } = require("spitroast");

// @ts-ignore - window is defined later in the bundle, so we assign it early
globalThis.window = globalThis;

async function initializeRain() {
    try {
        // Make 'freeze' and 'seal' do nothing
        Object.freeze = Object.seal = Object;

        await require("@metro/internals/caches").initMetroCache();
        require(".").default();
    } catch (e) {
        const { ClientInfoManager } = require("@api/native/modules");
        const stack = e instanceof Error ? e.stack : undefined;

        console.log(stack ?? e?.toString?.() ?? e);
        alert([
            "Failed to load rain!\n",
            `Build Number: ${ClientInfoManager.getConstants().Build}`,
            stack || e?.toString?.(),
        ].join("\n"));
    }
}

if (typeof window.__r === "undefined") {
    var _requireFunc: any;

    interface DeferredCall {
        fn: () => void;
    }

    const deferredCalls: DeferredCall[] = [];
    let isInitialized = false;

    const deferIfNeeded = (object: any, method: string, condition: (...args: any[]) => boolean) => {
        const original = object[method];
        object[method] = function (this: any, ...args: any[]) {
            if (!isInitialized && condition(...args)) {
                deferredCalls.push({ fn: () => original.apply(this, args) });
                return method === "callFunctionReturnFlushedQueue" ? object.flushedQueue() : undefined;
            }
            return original.apply(this, args);
        };
    };

    const resumeDeferred = () => {
        isInitialized = true;
        for (const call of deferredCalls) {
            call.fn();
        }
        deferredCalls.length = 0;
    };

    const onceIndexRequired = async (originalRequire: Metro.RequireFn) => {
        if (window.__fbBatchedBridge) {
            const batchedBridge = window.__fbBatchedBridge;
            deferIfNeeded(
                batchedBridge,
                "callFunctionReturnFlushedQueue",
                (...args) => args[0] === "AppRegistry" || !batchedBridge.getCallableModule(args[0])
            );
        }

        // Introduced since RN New Architecture
        if (window.RN$AppRegistry) {
            deferIfNeeded(
                window.RN$AppRegistry,
                "runApplication",
                () => true
            );
        }

        originalRequire(0);
        
        resumeDeferred();
        await initializeRain();
        //todo: move initplugins out of
        initPlugins()
    };

    Object.defineProperties(globalThis, {
        __r: {
            configurable: true,
            get: () => _requireFunc,
            set(v) {
                _requireFunc = function patchedRequire(a: number) {
                    // Initializing index.ts(x)
                    if (a === 0) {
                        if (window.modules instanceof Map) window.modules = Object.fromEntries(window.modules);
                        onceIndexRequired(v);
                        _requireFunc = v;
                    } else return v(a);
                };
            }
        },
        __d: {
            configurable: true,
            get() {
                // @ts-ignore - I got an error where 'Object' is undefined *sometimes*, which is literally never supposed to happen
                if (window.Object && !window.modules) {
                    window.modules = window.__c?.();
                }
                return this.value;
            },
            set(v) { this.value = v; }
        }
    });
} else {
    initializeRain();
    initPlugins()
}