import { createPluginStore } from "@api/storage";

interface HideBlockedAndIgnoredMessagesSettings {
	blocked: boolean;
	ignored: boolean;
	removeReplies: boolean;
}

export const {
    useStore: useHideBlockedAndIgnoredMessagesSettings,
    settings: hideblockedandignoredmessagesSettings,
} = createPluginStore<HideBlockedAndIgnoredMessagesSettings>("hideblockedandignoredmessages", {
    blocked: true,
    ignored: true,
    removeReplies: true,
});
