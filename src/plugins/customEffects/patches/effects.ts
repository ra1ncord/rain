const effectsURL = "https://raw.githubusercontent.com/SerStars/CustomEffects/refs/heads/main/skus.min.json";
const usersURL = "https://raw.githubusercontent.com/SerStars/CustomEffects/refs/heads/main/users.min.json";

export interface CustomEffect {
    skuId: string;
    config: {
        skuId: string;
        title: string;
        description: string;
        accessibilityLabel: string;
        // reducedMotionSrc: string;
        thumbnailPreviewSrc: string;
        effects: {
            src: string;
            loop: boolean;
            height: number;
            width: number;
            duration: number;
            start: number;
            loopDelay: number;
            // position: { x: number; y: number };
            // zIndex: number;
            // randomizedSources: string[];
        }[];
        // animationType: number;
        // type: number;
    };
}

export interface CustomEffectAssignment {
    skuId: string;
}

export let customEffects: Record<string, CustomEffect> = {};
export let userEffectData: Record<string, CustomEffectAssignment> = {};

export async function fetchEffectsData() {
    try {
        const res = await fetch(effectsURL);
        const data = await res.json();

        customEffects = data;
        // console.log("[CustomEffects] Effects loaded:", Object.keys(customEffects).length);
    } catch (e) {
        console.error("[CustomEffects] Failed to fetch effects", e);
    }
}

export async function fetchUserEffectData() {
    try {
        const res = await fetch(usersURL);
        const data = await res.json();

        userEffectData = data;
        // console.log("[CustomEffects] Users loaded:", Object.keys(userEffectData).length);
    } catch (e) {
        console.error("[CustomEffects] Failed to fetch users", e);
    }
}

export async function loadAllEffectData() {
    await Promise.all([
        fetchEffectsData(),
        fetchUserEffectData()
    ]);
}