import { before } from "@api/patcher";
import { findByName, findByStoreName } from "@metro";
import {realnitroSettings} from "../storage";

// heavily based off the godsent work of: https://github.com/Vendicated/Vencord/blob/575421f4d06fe6cda9c1cb3227060a20cd1c700f/src/plugins/fakeNitro/index.tsx

const { getStickerById } = findByStoreName("StickersStore");
const RowManager = findByName("RowManager");

const staticStickerRegex = /https:\/\/media\.discordapp\.net\/stickers\/(\d+)\.(?!gif)\w+/;
const animatedGifRegex = /https:\/\/media\.discordapp\.net\/stickers\/(\d+)\.gif/;
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
        if (data.rowType !== 1 || !realnitroSettings.transformSticker) return;

        const content = data.message.content;
        if (!content) return;

        let match = content.match(animatedGifRegex);
        if (match) {
            data.message.stickerItems = makeStickerItem(match[1], 4); // discord mobile moment lol (should be 2)
        }
        else if ((match = content.match(attachmentGifRegex))) {
            data.message.stickerItems = makeStickerItem(match[1], 2);
        }
        else if ((match = content.match(staticStickerRegex))) {
            data.message.stickerItems = makeStickerItem(match[1], 1);
        }
        else {
            return;
        }

        data.message.content = "";
        data.message.embeds = [];
    })
];
