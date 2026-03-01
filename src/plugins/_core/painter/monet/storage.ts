import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { MonetCache, MonetColors, MonetConfig, MonetPatchConfig } from "./types";

export interface MonetThemeSettings {
    colors: MonetColors;
    config: MonetConfig;
    active: boolean;
    cache: MonetCache;
    patches: MonetPatchConfig;
}

export const DEFAULT_SETTINGS: MonetThemeSettings = {
    colors: {
        neutral1: "#747679",
        neutral2: "#70777C",
        accent1: "#007FAC",
        accent2: "#657985",
        accent3: "#787296",
    },
    config: {
        wallpaper: "none",
        custom: [],
    },
    active: false,
    cache: {},
    patches: {
        from: "git",
    },
};

type MonetThemeStore = PluginStore<MonetThemeSettings>;

export const useMonetSettings = create<MonetThemeStore>()(
    persist(
        set => ({
            ...DEFAULT_SETTINGS,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<MonetThemeSettings>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "monettheme-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/monettheme.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
