import { fileExists, readFile, writeFile } from "@api/native/fs";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
    redirect: boolean;
    referrals: boolean;
}

interface CleanUrlsSettingsStore extends Settings {
    updateSettings: (settings: Partial<Settings>) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

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
        },
    };
};

export const useCleanUrlsSettings = create<CleanUrlsSettingsStore>()(
    persist(
        set => ({
            redirect: true,
            referrals: false,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "cleanurls-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/cleanurls.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export async function waitForCleanUrlsHydration(): Promise<void> {
    return new Promise(resolve => {
        if (useCleanUrlsSettings.getState()._hasHydrated) {
            resolve();
            return;
        }

        const unsubscribe = useCleanUrlsSettings.subscribe(
            state => {
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

export const cleanUrlsSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useCleanUrlsSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useCleanUrlsSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    }
});
