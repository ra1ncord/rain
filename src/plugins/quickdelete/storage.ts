import { createPluginStore } from "@api/storage";

interface QuickDeleteSettings {
    autoConfirmMessage: boolean;
    autoConfirmEmbed: boolean;
}

export const {
    useStore: useQuickDeleteSettings,
    settings: quickDeleteSettings,
} = createPluginStore<QuickDeleteSettings>("quickdelete", {
    autoConfirmMessage: true,
    autoConfirmEmbed: true,
});
