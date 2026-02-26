import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
    redirect: boolean;
    referrals: boolean;
}

type CleanUrlsSettingsStore = PluginStore<Settings>;

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
