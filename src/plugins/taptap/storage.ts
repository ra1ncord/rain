import { createPluginStore } from "@api/storage";

interface TapTapSettings {
    tapUsernameAction: "mention" | "profile";
    reply: boolean;
    userEdit: boolean;
    keyboardPopup: boolean;
    delay: string;
    debugMode: boolean;
}

export const {
    useStore: useTapTapSettings,
    settings: taptapSettings,
} = createPluginStore<TapTapSettings>("taptap", {
    tapUsernameAction: "mention",
    reply: true,
    userEdit: true,
    keyboardPopup: true,
    delay: "300",
    debugMode: false,
});
