import { fileExists, readFile, writeFile } from "@api/native/fs";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface FactSettings {
  sendAsReply: boolean;
  includeCitation: boolean;
}

interface GarySettings {
  imageSource: string;
}

interface HiddenSettings {
  enabled: boolean;
  visible: boolean;
  konochanBypassNsfw: boolean;
}

interface EnabledCommands {
  [key: string]: boolean;
}

interface MoreCommandsSettings {
  factSettings: FactSettings;
  garySettings: GarySettings;
  enabledCommands: EnabledCommands;
  hiddenSettings: HiddenSettings;
  pendingRestart: boolean;
  // Sysinfo settings
  device: boolean;
  hardware: boolean;
  software: boolean;
  discord: boolean;
  react: boolean;
  time: boolean;
  ephemeral: boolean;
  // Lovefemboys settings
  sortdefs: boolean;
  nsfwwarn: boolean;
}

interface MoreCommandsStore extends MoreCommandsSettings {
  updateFactSettings: (settings: Partial<FactSettings>) => void;
  updateGarySettings: (settings: Partial<GarySettings>) => void;
  updateEnabledCommands: (commands: Partial<EnabledCommands>) => void;
  updateHiddenSettings: (settings: Partial<HiddenSettings>) => void;
  setPendingRestart: (pending: boolean) => void;
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
            // not implemented
        },
    };
};

export const useMoreCommandsSettings = create<MoreCommandsStore>()(
    persist(
        set => ({
            factSettings: {
                sendAsReply: true,
                includeCitation: false,
            },
            garySettings: {
                imageSource: "gary",
            },
            enabledCommands: {
                catfact: true,
                dogfact: true,
                useless: true,
                petpet: true,
                konoself: true,
                konosend: true,
                firstmessage: true,
                sysinfo: true,
                spotifyTrack: true,
                spotifyAlbum: true,
                spotifyArtists: true,
                spotifyCover: true,
                gary: true,
                ip: true,
                lovefemboys: false,
                nekoslife: false,
                friendInviteCreate: true,
                friendInviteView: true,
                friendInviteRevoke: true,
            },
            hiddenSettings: {
                enabled: false,
                visible: false,
                konochanBypassNsfw: false,
            },
            pendingRestart: false,
            // Sysinfo settings
            device: true,
            hardware: true,
            software: true,
            discord: true,
            react: true,
            time: true,
            ephemeral: true,
            // Lovefemboys settings
            sortdefs: true,
            nsfwwarn: true,
            _hasHydrated: false,
            updateFactSettings: (newSettings: Partial<FactSettings>) =>
                set(state => ({
                    factSettings: { ...state.factSettings, ...newSettings },
                })),
            updateGarySettings: (newSettings: Partial<GarySettings>) =>
                set(state => ({
                    garySettings: { ...state.garySettings, ...newSettings },
                })),
            updateEnabledCommands: newCommands =>
                set(state => ({
                    enabledCommands: { ...state.enabledCommands, ...newCommands } as EnabledCommands,
                })),
            updateHiddenSettings: (newSettings: Partial<HiddenSettings>) =>
                set(state => ({
                    hiddenSettings: { ...state.hiddenSettings, ...newSettings },
                })),
            setPendingRestart: (pending: boolean) => set({ pendingRestart: pending }),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "morecommands-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/morecommands.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export async function waitForMoreCommandsSettingsHydration(): Promise<void> {
    return new Promise(resolve => {
        if (useMoreCommandsSettings.getState()._hasHydrated) {
            resolve();
            return;
        }

        const unsubscribe = useMoreCommandsSettings.subscribe(state => {
            if (state._hasHydrated) {
                unsubscribe();
                resolve();
            }
        });

        setTimeout(() => {
            unsubscribe();
            resolve();
        }, 5000);
    });
}

// Export a simple proxy for backward compatibility
export const storage = new Proxy({} as MoreCommandsSettings, {
    get(target, prop: string) {
        return useMoreCommandsSettings.getState()[prop as keyof MoreCommandsSettings];
    },
    set(target, prop: string, value: any) {
        const state = useMoreCommandsSettings.getState();
        if (prop === "factSettings") {
            state.updateFactSettings(value);
        } else if (prop === "garySettings") {
            state.updateGarySettings(value);
        } else if (prop === "enabledCommands") {
            state.updateEnabledCommands(value);
        } else if (prop === "hiddenSettings") {
            state.updateHiddenSettings(value);
        }
        return true;
    },
});
