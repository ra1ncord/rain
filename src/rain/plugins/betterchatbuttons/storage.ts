import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileExists, readFile, writeFile } from "@api/native/fs";

interface Settings {
    hide: {
        voice: boolean;
        gift: boolean;
        thread: boolean;
        app: boolean;
    };
    show: {
        thread: boolean;
    };
    dismiss: {
        actions: boolean;
        send: boolean;
    };
}

interface BetterChatButtonsSettingsStore extends Settings {
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

export const useBetterChatButtonsSettings = create<BetterChatButtonsSettingsStore>()(
    persist(
        (set) => ({
            hide: {
                app: true,
                gift: true,
                thread: true,
                voice: true,
            },
            show: {
                thread: false,
            },
            dismiss: {
                actions: true,
                send: false,
            },
            _hasHydrated: false,
            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: 'betterchatbuttons-settings',
            storage: createJSONStorage(() => createFileStorage("plugins/betterchatbuttons.json")),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export async function waitForBetterChatButtonsHydration(): Promise<void> {
    return new Promise((resolve) => {
        if (useBetterChatButtonsSettings.getState()._hasHydrated) {
            resolve();
            return;
        }
        
        const unsubscribe = useBetterChatButtonsSettings.subscribe(
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

export const betterChatButtonsSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        const state = useBetterChatButtonsSettings.getState();
        if (prop.includes('.')) {
            const [parent, child] = prop.split('.');
            return (state as any)[parent]?.[child];
        }
        return (state as any)[prop];
    },
    set(target, prop: string, value: any) {
        if (prop.includes('.')) {
            const [parent, child] = prop.split('.');
            const state = useBetterChatButtonsSettings.getState();
            useBetterChatButtonsSettings.getState().updateSettings({
                [parent]: {
                    ...(state as any)[parent],
                    [child]: value
                }
            } as any);
        } else {
            useBetterChatButtonsSettings.getState().updateSettings({ [prop]: value } as any);
        }
        return true;
    }
});