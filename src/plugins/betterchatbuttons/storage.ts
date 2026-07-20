import { createPluginStore } from "@api/storage";

interface BetterChatButtonsSettings {
    hide: {
        voice: boolean;
        gift: boolean;
        app: boolean;
    };
    dismiss: {
        actions: boolean;
        send: boolean;
    };
}

export const {
    useStore: useBetterChatButtonsSettings,
    settings: betterChatButtonsSettings,
} = createPluginStore<BetterChatButtonsSettings>("betterchatbuttons", {
    hide: {
        app: true,
        gift: true,
        voice: true,
    },
    dismiss: {
        actions: true,
        send: false,
    },
});
