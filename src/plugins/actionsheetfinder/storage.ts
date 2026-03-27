import { createPluginStore } from "@api/storage";

interface ActionSheetFinderSettings {
    logs: string[];
    addLog: (log: string) => void;
    clearLogs: () => void;
}

export const {
    useStore: useActionSheetFinderSettings,
    settings: actionsheetfinderSettings,
} = createPluginStore<ActionSheetFinderSettings>("actionsheetfinder", {
    logs: [],
    addLog: (log: string) => {
        const currentLogs = actionsheetfinderSettings.logs || [];
        actionsheetfinderSettings.logs = [...currentLogs.slice(-99), log];
    },
    clearLogs: () => {
        actionsheetfinderSettings.logs = [];
    },
});

export const clearLogs = () => actionsheetfinderSettings.clearLogs();
