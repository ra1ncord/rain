import { createPluginStore } from "@api/storage";

interface ChatBubblesSettings {
    avatarRadius: number;
    bubbleChatRadius: number;
    bubbleChatColor: string;
}

export const {
    useStore: useChatBubblesSettings,
    settings: chatBubblesSettings,
} = createPluginStore<ChatBubblesSettings>("chatbubbles", {
    avatarRadius: 12,
    bubbleChatRadius: 12,
    bubbleChatColor: "",
});
