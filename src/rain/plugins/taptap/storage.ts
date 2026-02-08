import { fileExists, readFile, writeFile } from "@api/native/fs";
import { createFileStorage } from "@api/storage";
import { ReactNative } from "@metro/common";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

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

export const useTapTapSettings = create<TapTapSettingsStore>()(
    persist(
        set => ({
            tapUsernameMention: ReactNative.Platform.select({ ios: true, android: false, default: true })!,
            reply: true,
            userEdit: true,
            keyboardPopup: true,
            delay: "300",
            debugMode: false,
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "taptap-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/taptap.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const taptapSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useTapTapSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useTapTapSettings.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    }
});
