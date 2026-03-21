import { createPluginStore } from "@api/storage";

interface CleanUrlsSettings {
    redirect: boolean;
    referrals: boolean;
}

export const {
    useStore: useCleanUrlsSettings,
    settings: cleanUrlsSettings,
} = createPluginStore<CleanUrlsSettings>("cleanurls", {
    redirect: true,
    referrals: false,
});
