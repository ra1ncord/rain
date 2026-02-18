import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Settings {
    dmTopBar: boolean;
    userList: boolean;
    profileUsername: boolean;
    removeDefaultMobile: boolean;
    useThemeColors: boolean;
}

type PlatformIndicatorSettingsStore = PluginStore<Settings>;

export const usePlatformIndicatorSettings = create<PlatformIndicatorSettingsStore>()(
    persist(
        set => ({
            dmTopBar: true,
            userList: true,
            profileUsername: true,
            removeDefaultMobile: true,
            useThemeColors: true,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "platformindicator-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/platformindicator.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const platformIndicatorSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return usePlatformIndicatorSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        usePlatformIndicatorSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
