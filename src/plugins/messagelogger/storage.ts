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
        ignoreSelfEdits: boolean;
    };
    databaseLogging: boolean;
    customEditTextEnabled: boolean;
    customDeleteTextEnabled: boolean;
    customEditText: string;
    customDeletedText: string;
    ignoreList: string;
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
        ignoreSelfEdits: true,
    },
    databaseLogging: false,
    customEditTextEnabled: false,
    customDeleteTextEnabled: false,
    customEditText: "-# `[ EDITED ]`",
    customDeletedText: "This message was deleted",

    ignoreList: ""
});
