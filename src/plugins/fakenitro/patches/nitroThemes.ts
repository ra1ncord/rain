import { instead } from "@api/patcher";
import { findByProps } from "@metro";

export default function getPatches() {
    const canUse = findByProps("canUseClientThemes");
    const AppearanceSettings = findByProps("setShouldSyncAppearanceSettings");

    return [
        instead("setShouldSyncAppearanceSettings", AppearanceSettings, () => false),
        instead("canUseClientThemes", canUse, () => true),
    ];
}
