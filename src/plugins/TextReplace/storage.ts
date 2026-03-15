import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Rule } from "./def";

export interface TextReplaceSettings {
    rules: Rule[]
}

export const useTextReplaceSettings = create<PluginStore<TextReplaceSettings>>()(
    persist(
        set => ({
            rules: [],
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<TextReplaceSettings>) => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "textreplace-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/textreplace.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated?.(true);
            }
        }
    )
);
