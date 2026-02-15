import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
    left: boolean;
    mods: boolean;
    customs: boolean;
}

type CustomBadgesSettingsStore = PluginStore<Settings>;

export const useCustomBadgesSettings = create<CustomBadgesSettingsStore>()(
    persist(
        set => ({
            left: true,
            mods: false,
            customs: false,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "globalbadges-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/globalbadges.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const customBadgesSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useCustomBadgesSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useCustomBadgesSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    }
});
