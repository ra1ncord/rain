import { createPluginStore } from "@api/storage";
import { ReactNative } from "@metro/common";

interface TapTapSettings {
    tapUsernameMention: boolean;
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
    tapUsernameMention: ReactNative.Platform.select({ ios: true, android: false, default: true })!,
    reply: true,
    userEdit: true,
    keyboardPopup: true,
    delay: "300",
    debugMode: false,
});
