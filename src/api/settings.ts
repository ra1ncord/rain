import { createStorage } from "./storage";
import { getLoaderConfigPath } from "./native/loader";

export interface Settings {
    debuggerUrl: string;
    devToolsUrl: string;
    developerSettings: boolean;
    autoDebugger: boolean;
    autoDevTools: boolean;
    safeMode?: {
        enabled: boolean;
        currentThemeId?: string;
    };
    enableEvalCommand?: boolean;
}

export interface LoaderConfig {
    customLoadUrl: {
        enabled: boolean;
        url: string;
    };
    loadReactDevTools: boolean;
}

export const settings = createStorage<Settings>("rain/RAIN_SETTINGS", {
    dflt: {
        debuggerUrl: "",
        devToolsUrl: "",
        developerSettings: false,
        autoDebugger: false,
        autoDevTools: false
}});

export const loaderConfig = createStorage<LoaderConfig>(
    getLoaderConfigPath(),
    {
        dflt: {
            customLoadUrl: {
                enabled: false,
                url: "http://localhost:4040/rain.js"
            },
            loadReactDevTools: false
        }
    }
);