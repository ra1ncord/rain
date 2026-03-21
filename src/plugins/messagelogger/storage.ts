import { createPluginStore } from "@api/storage";

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

export const {
    useStore: useMessageLoggerSettings,
    settings: messageLoggerSettings,
} = createPluginStore<MessageLoggerSettings>("messagelogger", {
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
});
