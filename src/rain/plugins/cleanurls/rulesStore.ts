import { fileExists, readFile, writeFile } from "@api/native/fs";
import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

export interface RulesType {
    providers: Record<
        string,
        {
            urlPattern?: string;
            rules?: string[];
            rawRules?: string[];
            referralMarketing?: string[];
            exceptions?: string[];
            redirections?: string[];
        }
    >;
}

interface RulesState {
    rules: RulesType | null;
    lastModified: string | null;
    update: () => Promise<void>;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

const listUrl = "https://rules2.clearurls.xyz/data.minify.json";

export const useRulesStore = create<RulesState>()(
    persist(
        (set, get) => ({
            rules: null,
            lastModified: null,
            _hasHydrated: false,
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
            update: async () => {
                try {
                    const headers: Record<string, string> = {};
                    const lastMod = get().lastModified;
                    if (lastMod) {
                        headers["if-modified-since"] = lastMod;
                    }

                    const res = await fetch(listUrl, { headers });
                    if (!res.ok) return;

                    const rules = await res.json();
                    const newLastModified = res.headers.get("last-modified");

                    set({
                        rules,
                        lastModified: newLastModified
                    });
                } catch (e) {
                }
            },
        }),
        {
            name: "cleanurls-rules",
            storage: createJSONStorage(() => createFileStorage("plugins/cleanurls-rules.json")),
            partialize: state => ({
                rules: state.rules,
                lastModified: state.lastModified,
            }),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
                state?.update();
            }
        }
    )
);
