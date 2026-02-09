import {
    getPluginSettingsComponent,
    isPluginCore,
    isPluginEnabled,
    startPlugin,
    stopPlugin,
    usePluginSettings,
} from "@plugins";
import { rainPlugin } from "@plugins/types";

import { UnifiedPluginModel } from ".";

export default function unifyRainPlugin(
    manifest: rainPlugin,
): UnifiedPluginModel {
    return {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description,
        authors: manifest.author,
        isEnabled: () => isPluginEnabled(manifest.id),
        isCore: () => isPluginCore(manifest.id),
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
