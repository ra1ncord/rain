import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Settings {
    useRoleColor: boolean;
}

type StaffTagsSettingsStore = PluginStore<Settings>;

export const useStaffTagsSettings = create<StaffTagsSettingsStore>()(
    persist(
        set => ({
            useRoleColor: false,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "stafftags-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/stafftags.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const storage = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useStaffTagsSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useStaffTagsSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    }
});
