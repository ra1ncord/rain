import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Settings {
    logs: string[];
    addLog: (log: string) => void;
    clearLogs: () => void;
}

type ActionSheetFinderSettingsStore = PluginStore<Settings>;

export const useActionSheetFinderSettings =
    create<ActionSheetFinderSettingsStore>()(
        persist(
            set => ({
                logs: [],
                _hasHydrated: false,
                updateSettings: (newSettings: Partial<Settings>) =>
                    set(state => ({ ...state, ...newSettings })),
                addLog: (log: string) =>
                    set(state => ({
                        logs: [...state.logs.slice(-99), log],
                    })),
                clearLogs: () => set({ logs: [] }),
                setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
            }),
            {
                name: "actionsheetfinder-settings",
                storage: createJSONStorage(() =>
                    createFileStorage("plugins/actionsheetfinder.json"),
                ),
                onRehydrateStorage: () => state => {
                    state?.setHasHydrated(true);
                },
            },
        ),
    );
