import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Settings {
  replaceButton: "gallery" | "apps" | "gift";
  pressAction: "profile" | "server";
  longPressAction: "profile" | "server";
  serverId?: string;
  showStatusCutout?: boolean;
  collapseWhileTyping?: boolean;
}

export const useChatboxAvatarSettings = create<PluginStore<Settings>>()(
  persist(
    set => ({
      replaceButton: "gallery",
      pressAction: "profile",
      longPressAction: "server", 
      serverId: "",
      showStatusCutout: false, 
      collapseWhileTyping: false,
      _hasHydrated: false,
      updateSettings: (newSettings: Partial<Settings>) => set(state => ({ ...state, ...newSettings })),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state })
    }),
    {
      name: "chatboxavatar-settings",
      storage: createJSONStorage(() => createFileStorage("plugins/chatboxavatar.json")),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated?.(true);
      }
    }
  )
);
