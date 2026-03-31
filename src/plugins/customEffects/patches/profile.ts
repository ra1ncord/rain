import { after } from "@api/patcher";
import { findByProps } from "@metro";

import { customEffects, userEffects, userEffectData } from "./effects";

export const patchGetUserProfile = () =>
    after("getUserProfile", findByProps("getUserProfile"), (_args: unknown[], profile: any | undefined) => {
        if (!profile) return profile;

        const customEffect = userEffectData[profile.userId];
        if (!customEffect) return profile;

        profile.profileEffect = { skuId: customEffect.skuId };
        return profile;
    });

export const patchGetAllProfileEffects = () =>
    after("getAllProfileEffects", findByProps("getProfileEffect"), (_args: unknown[], effects: any[]) => {
        effects.push(...Object.values(customEffects));
        effects.push(...userEffects);
        return effects;
    });

export const patchGetProfileEffect = () =>
    after("getProfileEffect", findByProps("getProfileEffect"), (args: unknown[], effect: any | undefined) => {
        if (effect) return effect;
        const id = args[0] as string;
        
        if (customEffects[id]) return customEffects[id];
        
        const userEffect = userEffects.find(e => e.skuId === id);
        return userEffect ?? effect;
    });
