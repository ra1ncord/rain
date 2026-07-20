import { before } from "@api/patcher";
import { findByName } from "@metro";
import { StickersStore } from "@metro/common/stores";

import { rainenhancementsSettings } from "../../storage";

// heavily based off the godsent work of: https://github.com/Vendicated/Vencord/blob/575421f4d06fe6cda9c1cb3227060a20cd1c700f/src/plugins/fakeNitro/index.tsx

const { getStickerById } = StickersStore;
const RowManager = findByName("RowManager");

const staticStickerRegex = /https:\/\/(?:media|cdn)\.discordapp\.(?:net|com)\/stickers\/(\d+)\.(?!gif)\w+/;
const animatedGifRegex = /https:\/\/(?:media|cdn)\.discordapp\.(?:net|com)\/stickers\/(\d+)\.gif/;
const attachmentGifRegex = /https:\/\/media\.discordapp\.net\/attachments\/\d+\/\d+\/(\d+)\.gif/;

function makeStickerItem(id: string, format: number) {
    const sticker = getStickerById(id);
    if (!sticker) return [];
    return [{
        id,
        format_type: sticker?.format_type ?? format, // fallback
        name: sticker?.name ?? "FakeNitroSticker"
    }];
}

export default [
    before("generate", RowManager.prototype, ([data]) => {
        if (data.rowType !== 1 || !rainenhancementsSettings.transformSticker) return;

        let msg = data.message; // normal
        if (!msg.content) msg = msg.messageSnapshots?.[0]?.message; // forwarded
        if (!msg?.content) return;
        let match = msg.content.match(animatedGifRegex);
        if (match) msg.stickerItems = makeStickerItem(match[1], 4);
        else if ((match = msg.content.match(attachmentGifRegex))) msg.stickerItems = makeStickerItem(match[1], 2);
        else if ((match = msg.content.match(staticStickerRegex))) msg.stickerItems = makeStickerItem(match[1], 1);

        if (match && msg.stickerItems.length > 0) {
            msg.content = "";
            msg.embeds = [];
        }
    })
];
