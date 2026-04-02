import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";

import { apiFetch } from "../lib/api";
import { useAuthorizationStore } from "../stores/AuthorizationStore";

export interface CustomEffect {
    skuId: string;
    config: any;
}

export let customEffects: Record<string, CustomEffect> = {};
export let userEffects: CustomEffect[] = [];
export let userEffectData: Record<string, { skuId: string }> = {};

export async function fetchEffectsData() {
    try {
        const data: CustomEffect[] = await apiFetch("/presets", { method: "POST" });
        const validEffects = Array.isArray(data)
            ? data.filter(e => e && e.skuId && e.config)
            : [];
        customEffects = Object.fromEntries(validEffects.map(e => [e.skuId, e]));
    } catch (e) {
        console.error("[CustomEffects] Failed to fetch effects", e);
        showToast("Failed to load effects", findAssetId("CircleXIcon"));
    }
}

export async function fetchUserEffectData() {
    try {
        const data = await apiFetch("/users", { method: "POST" });

        userEffects = [];
        userEffectData = {};

        Object.entries(data || {}).forEach(([userId, userInfo]: [string, any]) => {
            if (!userInfo) return;

            if (userInfo.selected) {
                userEffectData[userId] = { skuId: userInfo.selected };
            }

            if (userInfo.data && userInfo.data.skuId && userInfo.data.config) {
                const existingEffect = userEffects.find(e => e.skuId === userInfo.data.skuId);
                if (!existingEffect) {
                    userEffects.push({
                        skuId: userInfo.data.skuId,
                        config: userInfo.data.config
                    });
                }
            }
        });
    } catch (e) {
        console.error("[CustomEffects] Failed to fetch user effects", e);
        showToast("Failed to load user effects", findAssetId("CircleXIcon"));
    }
}

export async function loadAllEffectData() {
    const auth = useAuthorizationStore.getState();
    if (!auth.isAuthorized()) return;
    await Promise.all([fetchEffectsData(), fetchUserEffectData()]);
}
