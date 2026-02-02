declare global {
        type React = typeof import("react");

        // ReactNative/Hermes globals
        var globalEvalWithSourceUrl: (script: string, sourceURL: string) => any;
        var nativePerformanceNow: typeof performance.now;
        var nativeModuleProxy: Record<string, any>;
        var __turboModuleProxy: (name: string) => any;

        interface Window {
                [key: string]: any;
                rain: typeof import("@lib");
        }
}

export { };
