import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface QuickDeleteSettings {
    autoConfirmMessage: boolean;
    autoConfirmEmbed: boolean;
}

type QuickDeleteSettingsStore = PluginStore<QuickDeleteSettings>;

export const useQuickDeleteSettings = create<QuickDeleteSettingsStore>()(
    persist(
        set => ({
            autoConfirmMessage: true,
            autoConfirmEmbed: true,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "quickdelete-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/quickdelete.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export const quickDeleteSettings = new Proxy({} as QuickDeleteSettings, {
    get(target, prop: string) {
        return useQuickDeleteSettings.getState()[prop as keyof QuickDeleteSettings];
    },
    set(target, prop: string, value: any) {
        useQuickDeleteSettings.getState().updateSettings({ [prop]: value } as Partial<QuickDeleteSettings>);
        return true;
    },
});
