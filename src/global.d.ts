declare global {
        type React = typeof import("react");
        var SkiaApi: typeof import("@shopify/react-native-skia").Skia;

        // React Native and Hermes globals
        var globalEvalWithSourceUrl: (script: string, sourceURL: string) => any;
        var nativePerformanceNow: typeof performance.now;
        var nativeModuleProxy: Record<string, any>;
        var __turboModuleProxy: (name: string) => any;
}

export { };
