import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
	transformEmoji: boolean;
	transformSticker: boolean;
}

type RainEnhancementsSettingsStore = PluginStore<Settings>;

export const useRainEnhancementsSettings = create<RainEnhancementsSettingsStore>()(
    persist(
        set => ({
            transformEmoji: true,
            transformSticker: true,
            _hasHydrated: false,
            updateSettings: newSettings =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "rainenhancements-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/rainenhancements.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const rainenhancementsSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useRainEnhancementsSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useRainEnhancementsSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
