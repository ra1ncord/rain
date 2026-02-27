import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Settings {
    avatarRadius: number;
    bubbleChatRadius: number;
    bubbleChatColor: string;
}

type ChatBubblesSettingsStore = PluginStore<Settings>;

export const useChatBubblesSettings = create<ChatBubblesSettingsStore>()(
    persist(
        set => ({
            avatarRadius: 12,
            bubbleChatRadius: 12,
            bubbleChatColor: "",
            _hasHydrated: false,
            updateSettings: newSettings =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "chatbubbles-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/chatbubbles.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const chatBubblesSettings = new Proxy({} as Settings, {
    get(_target, prop: string) {
        return useChatBubblesSettings.getState()[prop as keyof Settings];
    },
    set(_target, prop: string, value: any) {
        useChatBubblesSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
