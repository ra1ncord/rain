import { instead } from "@api/patcher";
import { findByProps } from "@metro";

export default function getPatches() {
    const canUse = findByProps("canUseClientThemes");

    return [
        instead("canUseClientThemes", canUse, () => true),
    ];
}
