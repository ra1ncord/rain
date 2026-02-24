import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface HiddenChannelsSettings {
    showIcon: boolean;
    showPopup: boolean;
}

type HiddenChannelsSettingsStore = PluginStore<HiddenChannelsSettings>;

export const useHiddenChannelsSettings = create<HiddenChannelsSettingsStore>()(
    persist(
        set => ({
            showIcon: true,
            showPopup: true,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<HiddenChannelsSettings>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "hiddenchannels-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/hiddenchannels.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const hiddenChannelsSettings = new Proxy({} as HiddenChannelsSettings, {
    get(_target, prop: string) {
        return useHiddenChannelsSettings.getState()[prop as keyof HiddenChannelsSettings];
    },
    set(_target, prop: string, value: any) {
        useHiddenChannelsSettings.getState().updateSettings({ [prop]: value } as Partial<HiddenChannelsSettings>);
        return true;
    },
});
