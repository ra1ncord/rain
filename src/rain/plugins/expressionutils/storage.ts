import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ExpressionUtilsSettings {
    showCloneButton: boolean; // Add To Server (Emojis)
    showFavoriteButton: boolean; // Favorite (Stickers)
    showDownloadButton: boolean;
    showCopyURLButton: boolean;
    showCopyMarkdownButton: boolean;
}

type ExpressionUtilsStore = PluginStore<ExpressionUtilsSettings>;
export const useExpressionUtilsSettings = create<ExpressionUtilsStore>()(
    persist<ExpressionUtilsStore>(
        (set) => ({
            showCloneButton: true,
            showFavoriteButton: true,
            showDownloadButton: true,
            showCopyURLButton: true,
            showCopyMarkdownButton: true,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<ExpressionUtilsSettings>) =>
                set((state: ExpressionUtilsStore) => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "expressionutils-storage",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/expressionutils.json"),
            ),
            onRehydrateStorage: () => (state) => {
                if (state && typeof state === "object" && "setHasHydrated" in state && typeof state.setHasHydrated === "function") {
                    state.setHasHydrated(true);
                }
            },
        },
    ),
);
