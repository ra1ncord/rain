import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileExists, readFile, writeFile } from "@api/native/fs";
import { ReactNative } from "@metro/common";

interface Settings {
    tapUsernameMention: boolean;
    reply: boolean;
    userEdit: boolean;
    keyboardPopup: boolean;
    delay: string;
    debugMode: boolean;
}

interface TapTapSettingsStore extends Settings {
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
            // maybe this should be implemented :P
        },
    };
};

export const useTapTapSettings = create<TapTapSettingsStore>()(
    persist(
        (set) => ({
            tapUsernameMention: ReactNative.Platform.select({ ios: true, android: false, default: true })!,
            reply: true,
            userEdit: true,
            keyboardPopup: true,
            delay: "300",
            debugMode: false,
            _hasHydrated: false,
            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: 'taptap-settings',
            storage: createJSONStorage(() => createFileStorage("plugins/taptap.json")),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export async function waitForTapTapHydration(): Promise<void> {
    return new Promise((resolve) => {
        if (useTapTapSettings.getState()._hasHydrated) {
            resolve();
            return;
        }
        
        const unsubscribe = useTapTapSettings.subscribe(
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

export const taptapSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useTapTapSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useTapTapSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    }
});