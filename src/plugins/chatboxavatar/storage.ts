import { createPluginStore } from "@api/storage";

export interface ChatboxAvatarSettings {
  replaceButton: "gallery" | "apps" | "gift";
  pressAction: "profile" | "server";
  longPressAction: "profile" | "server";
  serverId?: string;
  showStatusCutout?: boolean;
  collapseWhileTyping?: boolean;
}

export const {
    useStore: useChatboxAvatarSettings,
    settings: chatboxAvatarSettings,
} = createPluginStore<ChatboxAvatarSettings>("chatboxavatar", {
    replaceButton: "gallery",
    pressAction: "profile",
    longPressAction: "server",
    serverId: "",
    showStatusCutout: false,
    collapseWhileTyping: false,
});
