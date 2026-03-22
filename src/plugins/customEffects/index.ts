import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import {
    patchGetUserProfile,
    patchGetAllProfileEffects,
    patchGetProfileEffect
} from "./patches/profile";

import { loadAllEffectData } from "./patches/effects";
import Settings from "./settings";

export default definePlugin({
    name: "CustomEffects",
    description: "Custom profile effects",
    author: [Developers.SerStars],
    id: "customeffects",
    version: "1.0.0",

    async start() {
        await loadAllEffectData();

        patchGetUserProfile();
        patchGetAllProfileEffects();
        patchGetProfileEffect();
    },

    stop() {},
    settings: Settings
});
