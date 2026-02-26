import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
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

type BetterChatButtonsSettingsStore = PluginStore<Settings>;

export const useBetterChatButtonsSettings = create<BetterChatButtonsSettingsStore>()(
    persist(
        set => ({
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
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "betterchatbuttons-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/betterchatbuttons.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const betterChatButtonsSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        const state = useBetterChatButtonsSettings.getState();
        if (prop.includes(".")) {
            const [parent, child] = prop.split(".");
            return (state as any)[parent]?.[child];
        }
        return (state as any)[prop];
    },
    set(target, prop: string, value: any) {
        if (prop.includes(".")) {
            const [parent, child] = prop.split(".");
            const state = useBetterChatButtonsSettings.getState();
            useBetterChatButtonsSettings.getState().updateSettings({
                [parent]: {
                    ...(state as any)[parent],
                    [child]: value
                }
            } as any);
        } else {
            useBetterChatButtonsSettings.getState().updateSettings({ [prop]: value } as any);
        }
        return true;
    }
});
