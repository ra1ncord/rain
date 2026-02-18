import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const IMAGE_FILES = [
    { id: "png", label: "PNG", defaultEnabled: true },
    { id: "jpg", label: "JPG", defaultEnabled: true },
    { id: "jpeg", label: "JPEG", defaultEnabled: true },
    { id: "svg", label: "SVG", defaultEnabled: true },
    { id: "gif", label: "GIF", defaultEnabled: true },
];

export const TEXT_FILES = [
    { id: "jsona", label: "JSONA", defaultEnabled: false },
    { id: "json", label: "JSON", defaultEnabled: false },
    { id: "lottie", label: "Lottie", defaultEnabled: false },
];

interface AssetBrowserSettings {
    enabledFilters: Record<string, boolean>;
}

type AssetBrowserSettingsStore = PluginStore<AssetBrowserSettings>;

const createInitialFilters = () => {
    const filters: Record<string, boolean> = {};
    [...IMAGE_FILES, ...TEXT_FILES].forEach(type => {
        filters[type.id] = type.defaultEnabled;
    });
    return filters;
};

export const useAssetBrowserSettings = create<AssetBrowserSettingsStore>()(
    persist(
        set => ({
            enabledFilters: createInitialFilters(),
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "assetbrowser-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/assetbrowser.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export const assetBrowserStorage = {
    get enabledFilters() {
        return useAssetBrowserSettings.getState().enabledFilters;
    },
    set enabledFilters(value: Record<string, boolean>) {
        useAssetBrowserSettings.getState().updateSettings({ enabledFilters: value });
    }
};
