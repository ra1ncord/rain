import { fileExists, readFile, writeFile } from "@api/native/fs";
import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
    left: boolean;
    mods: boolean;
    customs: boolean;
}

interface CustomBadgesSettingsStore extends Settings {
    updateSettings: (settings: Partial<Settings>) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useCustomBadgesSettings = create<CustomBadgesSettingsStore>()(
    persist(
        set => ({
            left: false,
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
