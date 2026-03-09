import { instead } from "@api/patcher";
import { findByProps } from "@metro";

const canUse = findByProps("canUseClientThemes");
const AppearanceSettings = findByProps("setShouldSyncAppearanceSettings")
AppearanceSettings.setShouldSyncAppearanceSettings(false)

export default function getPatches() {
    return [
        instead("setShouldSyncAppearanceSettings", AppearanceSettings, () => false),
        instead("canUseClientThemes", canUse, () => true),
    ];
}
