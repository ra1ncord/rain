import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

export interface Settings {
    emojiSize: number;
    hyperLink: boolean;
    stickerHyperLink: boolean;
    hideCollectiblesShop: boolean;
    hidePremium: boolean;
    hidePremiumGuildBoosting: boolean;
    hidePremiumGifting: boolean;
    hideGuildRoleSubscriptions: boolean;
    hidePremiumRestoreSubscription: boolean;
    hideQuests: boolean;
}

type FakeNitroSettingsStore = PluginStore<Settings>;

export const useFakeNitroSettings = create<FakeNitroSettingsStore>()(
    persist(
        set => ({
            emojiSize: 48,
            hyperLink: true,
            stickerHyperLink: true,
            hideCollectiblesShop: false,
            hidePremium: true,
            hidePremiumGuildBoosting: false,
            hidePremiumGifting: false,
            hideGuildRoleSubscriptions: false,
            hidePremiumRestoreSubscription: false,
            hideQuests: false,
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
