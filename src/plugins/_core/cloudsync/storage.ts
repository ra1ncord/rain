import { createPluginStore } from "@api/storage";

export interface CloudSyncSettings {
    autoSync: boolean;
    addToSettings: boolean;
    ignoredPlugins: string[];
    customHost: string;
    customClientId: string;
}

export const {
    useStore: useCloudSyncSettings,
    settings: cloudSyncSettings,
} = createPluginStore<CloudSyncSettings>("_core.cloudsync", {
    autoSync: false,
    addToSettings: true,
    ignoredPlugins: [],
    customHost: "",
    customClientId: "",
});
