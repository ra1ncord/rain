import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export enum AnimatedProfilesMode {
	Both = "both",
	UserBGOnly = "userbg_only",
	UserPFPOnly = "userpfp_only",
}

export interface AnimatedProfilesSettings {
	mode: AnimatedProfilesMode;
}

export const useAnimatedProfilesSettings = create<PluginStore<AnimatedProfilesSettings>>()(
    persist(
        set => ({
            mode: AnimatedProfilesMode.Both,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<AnimatedProfilesSettings>) => set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "animatedprofiles-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/animatedprofiles.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated?.(true);
            },
        },
    ),
);
