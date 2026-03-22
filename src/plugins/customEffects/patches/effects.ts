import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";

import { apiFetch } from "../lib/api";
import { useAuthorizationStore } from "../stores/AuthorizationStore";

export interface CustomEffect {
    skuId: string;
    config: any;
}

export let customEffects: Record<string, CustomEffect> = {};
export let userEffectData: Record<string, { skuId: string }> = {};

export async function fetchEffectsData() {
    try {
        const data: CustomEffect[] = await apiFetch("/presets");
        customEffects = Object.fromEntries(data.map(e => [e.skuId, e]));
    } catch (e) {
        console.error("[CustomEffects] Failed to fetch effects", e);
        showToast("Failed to load effects", findAssetId("CircleXIcon"));
    }
}

export async function fetchUserEffectData() {
    try {
        const data: Record<string, { selected: string | null }> = await apiFetch("/users");
        userEffectData = Object.fromEntries(
            Object.entries(data)
                .filter(([_, v]) => v.selected)
                .map(([userId, v]) => [userId, { skuId: v.selected! }])
        );
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
