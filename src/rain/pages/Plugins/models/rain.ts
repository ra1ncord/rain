import {
    getPluginSettingsComponent,
    isPluginCore,
    isPluginEnabled,
    startPlugin,
    stopPlugin,
    usePluginSettings,
} from "@plugins";
import { rainPlugin } from "@plugins/types";
import { Developers } from "@rain/Developers";
import { Platform } from "react-native";

import { UnifiedPluginModel } from ".";

function isDeveloper(author: { name: string }): boolean {
    return Object.keys(Developers).some(key => Developers[key as keyof typeof Developers].name === author.name);
}

export default function unifyRainPlugin(
    manifest: rainPlugin,
): UnifiedPluginModel {
    const developers = manifest.author?.filter(isDeveloper) ?? [];
    const contributors = manifest.author?.filter(a => !isDeveloper(a)) ?? [];

    const isSupportedPlatform = !manifest.platforms ||
        (manifest.platforms as string[]).includes(Platform.OS);

    const passesPredicates = !manifest.predicates ||
        manifest.predicates.every(predicate => {
            try {
                return predicate();
            } catch (e) {
                console.error(`Predicate failed for plugin ${manifest.id}:`, e);
                return false;
            }
        });

    const isCompatible = isSupportedPlatform && passesPredicates;

    return {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description,
        developers,
        contributors,
        isEnabled: () => isPluginEnabled(manifest.id),
        isCore: () => isPluginCore(manifest.id),
        isSupported: () => isCompatible,
        devOnly: manifest.devOnly,
        toggle(start: boolean) {
            try {
                start ? startPlugin(manifest.id) : stopPlugin(manifest.id);
            } catch (e) {
                console.error(e);
            }
        },
        usePluginState() {
            usePluginSettings(state => state.settings);
        },
        resolveSheetComponent() {
            return Promise.resolve({
                default: require("../sheets/PluginInfoActionSheet").default,
            });
        },
        getPluginSettingsComponent() {
            return getPluginSettingsComponent(manifest.id);
        },
    };
}
