import { createPluginStore } from "@api/storage";

export enum AnimatedProfilesMode {
	Both = "both",
	UserBGOnly = "userbg_only",
	UserPFPOnly = "userpfp_only",
}

export interface AnimatedProfilesSettings {
	mode: AnimatedProfilesMode;
}

export const {
    useStore: useAnimatedProfilesSettings,
    settings: animatedProfilesSettings,
} = createPluginStore<AnimatedProfilesSettings>("AnimatedProfiles", {
    mode: AnimatedProfilesMode.Both,
});
