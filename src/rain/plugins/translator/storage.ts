import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Settings {
    source_lang?: string;
    target_lang?: string;
    translator?: number;
    immersive_enabled?: boolean;
}

type TranslatorSettingsStore = PluginStore<Settings>;

export const useTranslatorSettings = create<TranslatorSettingsStore>()(
    persist(
        set => ({
            target_lang: "en",
            translator: 1,
            immersive_enabled: true,
            _hasHydrated: false,
            updateSettings: (newSettings: Settings) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "translator-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/translator.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const settings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useTranslatorSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useTranslatorSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
