import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MessageLoggerSettings {
    ignore: {
        users: string[];
        channels: string[];
        bots: boolean;
    };
    timestamps: boolean;
    ew: boolean;
    onlyTimestamps: boolean;
}

type MessageLoggerSettingsStore = PluginStore<MessageLoggerSettings>;

export const useMessageLoggerSettings = create<MessageLoggerSettingsStore>()(
    persist(
        set => ({
            ignore: {
                users: [],
                channels: [],
                bots: false,
            },
            timestamps: false,
            ew: false,
            onlyTimestamps: false,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "messagelogger-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/messagelogger.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
