import { createPluginStore } from "@api/storage";

interface ActionSheetFinderSettings {
    logs: string[];
}

export const {
    useStore: useActionSheetFinderSettings,
    settings: actionsheetfinderSettings,
} = createPluginStore<ActionSheetFinderSettings>("actionsheetfinder", {
    logs: [],
});

export const addLog = (log: string) => {
    const currentLogs = actionsheetfinderSettings.logs || [];
    actionsheetfinderSettings.logs = [...currentLogs.slice(-99), log];
};

export const clearLogs = () => {
    actionsheetfinderSettings.logs = [];
};
