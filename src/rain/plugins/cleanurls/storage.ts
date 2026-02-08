import { fileExists, readFile, writeFile } from "@api/native/fs";
import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
    redirect: boolean;
    referrals: boolean;
}

interface CleanUrlsSettingsStore extends Settings {
    updateSettings: (settings: Partial<Settings>) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useCleanUrlsSettings = create<CleanUrlsSettingsStore>()(
    persist(
        set => ({
            redirect: true,
            referrals: false,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "cleanurls-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/cleanurls.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const cleanUrlsSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useCleanUrlsSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useCleanUrlsSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    }
});
