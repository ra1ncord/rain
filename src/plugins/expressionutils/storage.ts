import { createPluginStore } from "@api/storage";

export interface ExpressionUtilsSettings {
    showCloneButton: boolean; // Add To Server (Emojis)
    showFavoriteButton: boolean; // Favorite (Stickers)
    showDownloadButton: boolean;
    showCopyURLButton: boolean;
    showCopyMarkdownButton: boolean;
}

export const {
    useStore: useExpressionUtilsSettings,
    settings: expressionUtilsSettings,
} = createPluginStore<ExpressionUtilsSettings>("expressionutils", {
    showCloneButton: true,
    showFavoriteButton: true,
    showDownloadButton: true,
    showCopyURLButton: true,
    showCopyMarkdownButton: true,
});
