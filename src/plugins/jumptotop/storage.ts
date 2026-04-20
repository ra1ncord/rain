import { createPluginStore } from "@api/storage";

export interface JumpToTopSettings {
    jumpToPresent: boolean;
    actionSheets: boolean;
    oldButton: boolean;
}

export const {
    useStore: useJumpToTopSettings,
    settings: jumpToTopSettings
} = createPluginStore<JumpToTopSettings>("jumptotop", {
    jumpToPresent: true,
    actionSheets: true,
    oldButton: false
});