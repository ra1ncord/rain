import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getLoaderConfigPath } from "./native/loader";
import { createFileStorage, createFlattenedFileStorage } from "./storage";

export interface Settings {
  debuggerUrl: string;
  devToolsUrl: string;
  developerSettings: boolean;
  autoDebugger: boolean;
  autoDevTools: boolean;
  safeMode?: boolean;
  settingsPosition: string;
  pluginCard: {
    showInfoButton: boolean;
    openOnPress: boolean;
  };
  assetBrowser: {
    enabledFilters: Record<string, boolean>;
  };
}

export interface LoaderConfig {
  customLoadUrl: {
    enabled: boolean;
    url: string;
  };
  loadReactDevTools: boolean;
}

interface SettingsStore extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>()(
    persist(
        set => ({
            debuggerUrl: "",
            devToolsUrl: "",
            developerSettings: false,
            autoDebugger: false,
            autoDevTools: false,
            safeMode: false,
            settingsPosition: "TOP",
            pluginCard: {
                showInfoButton: false,
                openOnPress: true,
            },
            assetBrowser: {
                enabledFilters: {
                    png: true,
                    jpg: true,
                    jpeg: true,
                    svg: true,
                    gif: true,
                    json: false,
                    jsona: false,
                    lottie: false,
                }
            },
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
        }),
        {
            name: "rain-settings",
            storage: createJSONStorage(() => createFileStorage("rain/RAIN_SETTINGS")),
        }
    )
);

interface LoaderConfigStore extends LoaderConfig {
  updateLoaderConfig: (config: Partial<LoaderConfig>) => void;
}

export const useLoaderConfig = create<LoaderConfigStore>()(
    persist(
        set => ({
            customLoadUrl: {
                enabled: false,
                url: "http://localhost:4040/rain.js",
            },
            loadReactDevTools: false,
            updateLoaderConfig: newConfig => set(state => ({ ...state, ...newConfig })),
        }),
        {
            name: "loader-config",
            storage: createJSONStorage(() => createFlattenedFileStorage<LoaderConfig>(getLoaderConfigPath())),
        }
    )
);

export const settings = () => useSettings.getState();
export const loaderConfig = () => useLoaderConfig.getState();

export const useAssetBrowserSettings = () => {
    const settings = useSettings(state => state.assetBrowser);
    const updateSettings = useSettings(state => state.updateSettings);

    return {
        enabledFilters: settings.enabledFilters,
        updateSettings: (newSettings: { enabledFilters?: Record<string, boolean> }) => {
            updateSettings({ assetBrowser: { ...settings, ...newSettings } });
        }
    };
};
