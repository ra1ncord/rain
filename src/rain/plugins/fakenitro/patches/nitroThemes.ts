import { instead } from "@api/patcher";
import { findByProps } from "@metro";

const canUse = findByProps("canUseClientThemes");

export default function getPatches() {
    return [
        instead("canUseClientThemes", canUse, () => true),
    ];
}
