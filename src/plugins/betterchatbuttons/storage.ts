import { createPluginStore } from "@api/storage";

interface BetterChatButtonsSettings {
    hide: {
        voice: boolean;
        gift: boolean;
        thread: boolean;
        app: boolean;
    };
    show: {
        thread: boolean;
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
        thread: true,
        voice: true,
    },
    show: {
        thread: false,
    },
    dismiss: {
        actions: true,
        send: false,
    },
});
