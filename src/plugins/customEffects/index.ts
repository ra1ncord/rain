import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import { loadAllEffectData } from "./patches/effects";
import {
    patchGetAllProfileEffects,
    patchGetProfileEffect,
    patchGetUserProfile } from "./patches/profile";
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
