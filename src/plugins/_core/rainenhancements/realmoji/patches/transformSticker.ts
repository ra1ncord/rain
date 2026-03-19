import { before } from "@api/patcher";
import { findByName, findByStoreName } from "@metro";

import { rainenhancementsSettings } from "../../storage";

// heavily based off the godsent work of: https://github.com/Vendicated/Vencord/blob/575421f4d06fe6cda9c1cb3227060a20cd1c700f/src/plugins/fakeNitro/index.tsx

const { getStickerById } = findByStoreName("StickersStore");
const RowManager = findByName("RowManager");

const staticStickerRegex = /https:\/\/(?:media|cdn)\.discordapp\.(?:net|com)\/stickers\/(\d+)\.(?!gif)\w+/;
const animatedGifRegex = /https:\/\/(?:media|cdn)\.discordapp\.(?:net|com)\/stickers\/(\d+)\.gif/;
const attachmentGifRegex = /https:\/\/media\.discordapp\.net\/attachments\/\d+\/\d+\/(\d+)\.gif/;

function makeStickerItem(id: string, format: number) {
    const sticker = getStickerById(id);
    return [{
        id,
        format_type: sticker?.format_type ?? format, // fallback
        name: sticker?.name ?? "FakeNitroSticker"
    }];
}

export default [
    before("generate", RowManager.prototype, ([data]) => {
        if (data.rowType !== 1 || !rainenhancementsSettings.transformSticker) return;

        // normal msg
        const msg = data.message;
        if (msg.content) {
            let match = msg.content.match(animatedGifRegex);
            if (match) msg.stickerItems = makeStickerItem(match[1], 4);
            else if ((match = msg.content.match(attachmentGifRegex))) msg.stickerItems = makeStickerItem(match[1], 2);
            else if ((match = msg.content.match(staticStickerRegex))) msg.stickerItems = makeStickerItem(match[1], 1);

            if (match) {
                msg.content = "";
                msg.embeds = [];
            }
        }

        // forwarded msg
        const snapshot = msg.messageSnapshots?.[0]?.message;
        if (snapshot?.content) {
            let match = snapshot.content.match(animatedGifRegex);
            if (match) snapshot.stickerItems = makeStickerItem(match[1], 4);
            else if ((match = snapshot.content.match(attachmentGifRegex))) snapshot.stickerItems = makeStickerItem(match[1], 2);
            else if ((match = snapshot.content.match(staticStickerRegex))) snapshot.stickerItems = makeStickerItem(match[1], 1);

            if (match) {
                snapshot.content = "";
                snapshot.embeds = [];
            }
        }
    })
];
