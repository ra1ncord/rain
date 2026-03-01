import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Settings {
    primary: number | null;
    accent: number | null;
    enabled: boolean;
    bannerFallback: boolean;
    /** Opt-in: share your profile colors to the public registry */
    shareColors: boolean;
    /** Apply registry colors to other users' profiles */
    showOtherColors: boolean;
    /** URL of the profile colors registry worker */
    registryUrl: string;
}

type ProfileColorSettingsStore = PluginStore<Settings>;

export const useProfileColorStore = create<ProfileColorSettingsStore>()(
    persist(
        set => ({
            primary: null,
            accent: null,
            enabled: false,
            bannerFallback: false,
            shareColors: false,
            showOtherColors: true,
            registryUrl: "https://profilecolors-registry.songspotlight.workers.dev",
            _hasHydrated: false,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "profilecolor-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/profilecolor.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const profilecolorSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useProfileColorStore.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useProfileColorStore.getState().updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});
