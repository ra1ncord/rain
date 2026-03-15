import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import { createUserBGPatcher,fetchData } from "./patches/userbg";
import { createUserPFPPatcher,fetchData as fetchUserPFPData } from "./patches/userpfp";
import Settings from "./settings";
import { AnimatedProfilesMode,useAnimatedProfilesSettings } from "./storage";

let unpatches: (() => void)[] = [];

export default definePlugin({
    name: "Animated Profiles",
    description: "Custom animated profile pictures and backgrounds using UserPFP and UserBG",
    author: [Contributors.sapphire, Contributors.rico040, Developers.kmmiio99o, Developers.SerStars],
    id: "animatedprofiles",
    version: "1.0.0",
    start() {
        const { mode } = useAnimatedProfilesSettings.getState();
        const isBGEnabled = () => mode === AnimatedProfilesMode.Both || mode === AnimatedProfilesMode.UserBGOnly;
        const isPFPEnabled = () => mode === AnimatedProfilesMode.Both || mode === AnimatedProfilesMode.UserPFPOnly;

        if (isBGEnabled()) {
            fetchData();
            const bgPatcher = createUserBGPatcher(isBGEnabled);
            unpatches.push(bgPatcher());
        }

        if (isPFPEnabled()) {
            fetchUserPFPData();
            const pfpPatcher = createUserPFPPatcher(isPFPEnabled);
            unpatches.push(pfpPatcher());
        }
    },
    stop() {
        for (const unpatch of unpatches) {
            unpatch?.();
        }
        unpatches = [];
    },
    settings: Settings,
});
