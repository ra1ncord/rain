import {
  startPlugin,
  stopPlugin,
  isPluginEnabled,
  pluginSettings,
  getPluginSettingsComponent,
} from "@plugins";
import { rainPlugin } from "@plugins/types";

import { UnifiedPluginModel } from ".";
import { useObservable } from "@lib/api/storage";

export default function unifyRainPlugin(
  manifest: rainPlugin,
): UnifiedPluginModel {
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    authors: manifest.author,
    isEnabled: () => isPluginEnabled(manifest.id),
    toggle(start: boolean) {
      try {
        start ? startPlugin(manifest.id) : stopPlugin(manifest.id);
      } catch (e) {
        console.error(e);
      }
    },
    usePluginState() {
      useObservable([pluginSettings]);
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
