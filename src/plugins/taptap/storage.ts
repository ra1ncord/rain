import { createPluginStore } from "@api/storage";

interface TapTapSettings {
    tapUsernameAction: "mention" | "profile";
    openProfileOnTap: boolean;
    reply: boolean;
    userEdit: boolean;
    keyboardPopup: boolean;
    debugMode: boolean;
}

export const {
    useStore: useTapTapSettings,
    settings: taptapSettings,
} = createPluginStore<TapTapSettings>("taptap", {
    tapUsernameAction: "mention",
    openProfileOnTap: false,
    reply: true,
    userEdit: true,
    keyboardPopup: true,
    debugMode: false,
});
