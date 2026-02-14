import { before,instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";

import { fakenitroSettings } from "../storage";
import { buildStickerURL,modifyIfNeeded } from "../utils";
import { logger } from "@lib/utils/logger";

const messageModule = findByProps("sendMessage", "receiveMessage");
const uploadModule = findByProps("uploadLocalFiles");
const { getCurrentUser } = findByStoreName("UserStore");
const { getStickerById } = findByStoreName("StickersStore");
const ChannelStore = findByStoreName("ChannelStore");

const patches = [
    before("sendMessage", messageModule, args => {
        if (getCurrentUser?.().premiumType === null) modifyIfNeeded(args[1]);
    }),

    // inspired by https://github.com/aliernfrog/vd-plugins/blob/3ee3eac528cd2ef7222d444516d4b4c3e80b6c6f/plugins/FreeStickers/src/patches/message.ts
    instead("sendStickers", messageModule, (args, origFunc) => {
        // dont care if we got nitro
        if (getCurrentUser?.().premiumType !== null) return origFunc(...args);
        const sticker = getStickerById(args[1]);
        logger.log(sticker);
        // dont care if its a discord sticker
        if (sticker.format_type === 3 || sticker.pack_id !== undefined) return origFunc(...args);
        const channel = ChannelStore.getChannel(args[0])?.guild_id;
        // dont care if its a server sticker
        if (channel === sticker.guild_id) return origFunc(...args);
        const stickerName = sticker.name ?? "FakeNitroSticker";
        let stickerURL = buildStickerURL(sticker);
        if (stickerName) stickerURL = fakenitroSettings.stickerHyperLink ? `[${stickerName}](${stickerURL})` : stickerURL;
        messageModule.sendMessage(args[0], { content: stickerURL }, null, args[3]);
    }),
];

if (uploadModule?.uploadLocalFiles !== undefined) {
    patches.push(
        before("uploadLocalFiles", uploadModule, args => {
            if (getCurrentUser?.().premiumType === null)
                modifyIfNeeded(args[0].parsedMessage);
        }),
    );
}
export default [...patches];
