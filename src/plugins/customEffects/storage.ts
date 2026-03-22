import { createPluginStore } from "@api/storage";

export enum CustomEffectsProfileMode {
    PreferCustomEffects = "prefersCustomEffects",
    PreferNativeEffects = "prefersNativeEffects",
}

export interface CustomEffectsProfileSettings {
    mode: CustomEffectsProfileMode;
}

export const {
    useStore: useCustomEffectSettings,
    settings: customEffectSettings,
} = createPluginStore<CustomEffectsProfileSettings>("CustomEffects", {
    mode: CustomEffectsProfileMode.PreferCustomEffects,
});
