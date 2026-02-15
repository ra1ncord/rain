import { instead } from "@api/patcher";
import { findByProps } from "@metro";

const AppearanceSettings = findByProps("setShouldSyncAppearanceSettings");
const canUse = findByProps("canUseClientThemes");

export default [
    instead("setShouldSyncAppearanceSettings", AppearanceSettings, () => false),
    instead("canUseClientThemes", canUse, () => true),
];
