import { createPluginStore } from "@api/storage";

interface PastelizeSettings {
    pastelizeAll: boolean;
    webhookName: boolean;
}

export const {
    useStore: usePastelizeSettings,
    settings: pastelizeSettings,
} = createPluginStore<PastelizeSettings>("pastelize", {
    pastelizeAll: false,
    webhookName: true,
});
