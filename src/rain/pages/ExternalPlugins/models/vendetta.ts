import { VdPluginManager, VendettaPlugin } from "@rain/plugins/_core/traveller/vendetta";
import { useObservable } from "@api/storage/bnstorage";
import { UnifiedPluginModel } from ".";

export default function unifyVdPlugin(
    vdPlugin: VendettaPlugin,
): UnifiedPluginModel {
    return {
        id: vdPlugin.id,
        name: vdPlugin.manifest.name,
        description: vdPlugin.manifest.description,
        authors: vdPlugin.manifest.authors,
        icon: vdPlugin.manifest.vendetta?.icon,
        isEnabled: () => vdPlugin.enabled,
        isInstalled: () =>
            Boolean(vdPlugin && VdPluginManager.plugins[vdPlugin.id]),
        usePluginState() {
            useObservable([VdPluginManager.plugins]);
        },
        toggle(start: boolean) {
            start
                ? VdPluginManager.startPlugin(vdPlugin.id)
                : VdPluginManager.stopPlugin(vdPlugin.id);
        },
        resolveSheetComponent() {
            // Return a Promise resolving to the unified PluginInfoActionSheet for consistency
            return Promise.resolve({
                default: require("../sheets/PluginInfoActionSheet").default,
            });
        },
        getPluginSettingsComponent() {
            return VdPluginManager.getSettings(vdPlugin.id);
        },
    };
}