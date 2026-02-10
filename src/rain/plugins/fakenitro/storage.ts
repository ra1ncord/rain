import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface Settings {
	emojiSize: number;
	hyperLink: boolean;
	stickerHyperLink: boolean;
}

type FakeNitroSettingsStore = PluginStore<Settings>;

export const useFakeNitroSettings = create<FakeNitroSettingsStore>()(
    persist(
        set => ({
            emojiSize: 48,
            hyperLink: true,
            stickerHyperLink: true,
            _hasHydrated: false,
            updateSettings: newSettings =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "fakenitro-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/fakenitro.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const fakenitroSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useFakeNitroSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useFakeNitroSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
