import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
    upHideVoiceButton: boolean;
    upHideVideoButton: boolean;
    dmHideCallButton: boolean;
    dmHideVideoButton: boolean;
    hideVCVideoButton: boolean;
}

type HideCallButtonsSettingsStore = PluginStore<Settings>;

export const useHideCallButtonsSettings =
    create<HideCallButtonsSettingsStore>()(
        persist(
            set => ({
                upHideVoiceButton: true,
                upHideVideoButton: true,
                dmHideCallButton: true,
                dmHideVideoButton: true,
                hideVCVideoButton: false,
                _hasHydrated: false,
                updateSettings: newSettings =>
                    set(state => ({ ...state, ...newSettings })),
                setHasHydrated: (state: boolean) =>
                    set({ _hasHydrated: state }),
            }),
            {
                name: "hidecallbuttons-settings",
                storage: createJSONStorage(() =>
                    createFileStorage("plugins/hidecallbuttons.json"),
                ),
                onRehydrateStorage: () => state => {
                    state?.setHasHydrated(true);
                },
            },
        ),
    );

export const hidecallbuttonsSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useHideCallButtonsSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useHideCallButtonsSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
