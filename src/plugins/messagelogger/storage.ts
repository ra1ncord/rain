import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MessageLoggerSettings {
    deleted: {
        enabled: boolean;
        showTimestamps: boolean;
        use12Hour: boolean;
        showOnlyTimestamp: boolean;
    };
    edited: {
        enabled: boolean;
        showSeparator: boolean;
    };
    filters: {
        ignoreBots: boolean;
    };
    databaseLogging: boolean;
}

type MessageLoggerSettingsStore = PluginStore<MessageLoggerSettings>;

export const useMessageLoggerSettings = create<MessageLoggerSettingsStore>()(
    persist(
        set => ({
            deleted: {
                enabled: true,
                showTimestamps: false,
                use12Hour: false,
                showOnlyTimestamp: false,
            },
            edited: {
                enabled: true,
                showSeparator: true,
            },
            filters: {
                ignoreBots: false,
            },
            databaseLogging: false,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<MessageLoggerSettings>) => set(state => ({ ...state, ...newSettings })),
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
