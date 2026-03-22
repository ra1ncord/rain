import { after } from "@api/patcher";
import { findByProps } from "@metro";

import { customEffects, userEffectData } from "./effects";
// import { customEffectSettings, CustomEffectsProfileMode } from "../storage";

export const patchGetUserProfile = () =>
    after(
        "getUserProfile",
        findByProps("getUserProfile"),
        (_args: unknown[], profile: any | undefined) => {
            if (!profile) return profile;

            const customEffect = userEffectData[profile.userId];
            if (!customEffect) return profile;

            // if (customEffectSettings.mode === CustomEffectsProfileMode.PreferCustomEffects) {
            profile.profileEffect = {
                skuId: customEffect.skuId,
            };
            // }

            return profile;
        },
    );

export const patchGetAllProfileEffects = () =>
    after(
        "getAllProfileEffects",
        findByProps("getProfileEffect"),
        (_args: unknown[], discordEffects: any[]) => {
            discordEffects.push(...Object.values(customEffects));
            return discordEffects;
        },
    );

export const patchGetProfileEffect = () =>
    after(
        "getProfileEffect",
        findByProps("getProfileEffect"),
        (args: unknown[], effect: any | undefined) => {
            if (effect) return effect;

            const id = args[0] as string;
            return customEffects[id] ?? effect;
        },
    );
