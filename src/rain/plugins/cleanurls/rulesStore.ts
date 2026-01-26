import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileExists, readFile, writeFile } from "@api/native/fs";

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

const createFileStorage = (filePath: string) => {
    return {
        getItem: async (name: string): Promise<string | null> => {
            try {
                const exists = await fileExists(filePath);
                if (!exists) return null;
                return await readFile(filePath);
            } catch (e) {
                console.error(`Failed to read storage from '${filePath}'`, e);
                return null;
            }
        },
        setItem: async (name: string, value: string): Promise<void> => {
            try {
                await writeFile(filePath, value);
            } catch (e) {
                console.error(`Failed to write storage to '${filePath}'`, e);
            }
        },
        removeItem: async (name: string): Promise<void> => {
            // Not existent
        },
    };
};

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
            name: 'cleanurls-rules',
            storage: createJSONStorage(() => createFileStorage("plugins/cleanurls-rules.json")),
            partialize: (state) => ({
                rules: state.rules,
                lastModified: state.lastModified,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
                state?.update();
            }
        }
    )
);

export async function waitForRulesHydration(): Promise<void> {
    return new Promise((resolve) => {
        if (useRulesStore.getState()._hasHydrated) {
            resolve();
            return;
        }
        
        const unsubscribe = useRulesStore.subscribe(
            (state) => {
                if (state._hasHydrated) {
                    unsubscribe();
                    resolve();
                }
            }
        );
        
        setTimeout(() => {
            unsubscribe();
            resolve();
        }, 5000);
    });
}