import {
  disablePlugin,
  enablePlugin,
  getPluginSettingsComponent,
  isPluginEnabled,
  pluginSettings,
} from "@rain/plugins/traveller/bunny";
import { BunnyPluginManifest } from "@rain/plugins/traveller/types";
import { useObservable } from "@api/storage/bnstorage";

import { UnifiedPluginModel } from ".";

export default function unifyBunnyPlugin(
  manifest: BunnyPluginManifest,
): UnifiedPluginModel {
  return {
    id: manifest.id,
    name: manifest.display.name,
    description: manifest.display.description,
    authors: manifest.display.authors,
    isEnabled: () => isPluginEnabled(manifest.id),
    isInstalled: () => manifest.id in pluginSettings,
    usePluginState() {
      useObservable([pluginSettings]);
    },
    toggle(start: boolean) {
      try {
        start ? enablePlugin(manifest.id, true) : disablePlugin(manifest.id);
      } catch (e) {
        console.error(e);
        // showToast("Failed to toggle plugin " + e, findAssetId("Small"));
      }
    },
    resolveSheetComponent() {
      // Return a Promise resolving to the sheet component for interface consistency
      return Promise.resolve({
        default: require("../sheets/PluginInfoActionSheet").default,
      });
    },
    getPluginSettingsComponent() {
      return getPluginSettingsComponent(manifest.id);
    },
  };
}
