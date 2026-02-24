import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CloudSyncSettings {
    autoSync: boolean;
    addToSettings: boolean;
    ignoredPlugins: string[];
    customHost: string;
    customClientId: string;
    _hasHydrated: boolean;
}

type CloudSyncSettingsStore = PluginStore<CloudSyncSettings>;

export const useCloudSyncSettings = create<CloudSyncSettingsStore>()(
    persist(
        set => ({
            autoSync: false,
            addToSettings: true,
            ignoredPlugins: [],
            customHost: "",
            customClientId: "",
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<CloudSyncSettings>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "cloud-sync-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/cloud-sync.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const cloudSyncSettings = new Proxy({} as CloudSyncSettings, {
    get(_target, prop: string) {
        return useCloudSyncSettings.getState()[prop as keyof CloudSyncSettings];
    },
    set(_target, prop: string, value: any) {
        useCloudSyncSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<CloudSyncSettings>);
        return true;
    },
});
