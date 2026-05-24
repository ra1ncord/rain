import { instead } from "@api/patcher";
import { findByProps } from "@metro";

const stickerUtils = findByProps("getStickerSendability", "isSendableSticker");
const SENDABLE = stickerUtils.StickerSendability?.SENDABLE ?? 0;

export default function getPatches() {
    return [
        instead("getStickerSendability", stickerUtils, () => SENDABLE),

        instead("isSendableSticker", stickerUtils, () => true),
    ];
}
