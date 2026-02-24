import { definePlugin } from "@plugins";

import Settings from "./settings";
import patchMessageActionSheet from "./patches/ActionSheet";
import patchSettingsSections from "./patches/SettingsSections";

type Unpatch = () => void;

let unpatch: Unpatch | null = null;
let unpatchSettingsSections: (() => void) | null = null;

export default definePlugin({
  name: "ClearMenus",
  description: "Hide unwanted buttons and settings",
  author: [Developers.LampDelivery],
  id: "clearmenus",
  version: "1.0.0",
  start() {
    try {
      unpatch = patchMessageActionSheet();
      const patches = patchSettingsSections();
      if (Array.isArray(patches)) {
        unpatchSettingsSections = () => patches.forEach(fn => fn());
      }
    } catch (error) {}
  },
  stop() {
    try {
      unpatch?.();
      unpatchSettingsSections?.();
    } catch (error) {
    } finally {
      unpatch = null;
      unpatchSettingsSections = null;
    }
  },
  settings: Settings,
});
