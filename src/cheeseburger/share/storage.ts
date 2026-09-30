import { createPluginStore } from "@api/storage";

interface ShareSettings {
    menuWorks: boolean;
}

export const {
    useStore: useShareSettings,
    settings: shareSettings,
} = createPluginStore<ShareSettings>("cheeseburger-share", {
    menuWorks: false,
});
