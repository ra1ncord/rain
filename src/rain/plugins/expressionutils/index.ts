import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";

import patchMessageEmojiActionSheet from "./patchMessageEmojiActionSheet";
import ExpressionUtilsSettings from "./settings";
import { patchStickerActionSheet } from "./stickerutils";

type Unpatch = () => void;

const unpatches: Unpatch[] = [];

function getEmojiURL(emojiId: string, animated: boolean = false): string {
    const extension = animated ? "gif" : "png";
    return `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=48&quality=lossless`;
}

function getEmojiURLLarge(emojiId: string, animated: boolean = false): string {
    const extension = animated ? "gif" : "png";
    return `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=128&quality=lossless`;
}

async function downloadEmoji(emojiId: string, emojiName: string, animated: boolean = false) {
    try {
        const url = getEmojiURLLarge(emojiId, animated);
        const extension = animated ? "gif" : "png";

        const response = await fetch(url);
        const blob = await response.blob();

        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(",")[1];

            const FileManager = findByProps("writeFile", "readFile");
            if (FileManager) {
                const fileName = `${emojiName}_${emojiId}.${extension}`;
                await FileManager.writeFile("documents", `emojis/${fileName}`, base64, "base64");
                showToast(`Downloaded ${emojiName} to Documents/emojis/`);
            } else {
                showToast("Failed to access file system");
            }
        };
    } catch (e) {
        console.error("[ExpressionUtils] Download error:", e);
        showToast("Failed to download emoji");
    }
}

async function cloneEmojiToGuild(emojiId: string, emojiName: string, animated: boolean, guildId: string) {
    try {
        const url = getEmojiURLLarge(emojiId, animated);

        const response = await fetch(url);
        const blob = await response.blob();

        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onloadend = async () => {
            const base64data = reader.result as string;

            const { createGuildEmoji } = findByProps("createGuildEmoji") || {};
            if (createGuildEmoji) {
                try {
                    await createGuildEmoji({
                        guildId,
                        name: emojiName,
                        image: base64data,
                    });
                    showToast(`Cloned ${emojiName} to server!`);
                } catch (err: any) {
                    console.error("[ExpressionUtils] Clone error:", err);
                    showToast(`Failed to clone: ${err.message || "Unknown error"}`);
                }
            } else {
                showToast("Failed to access emoji API");
            }
        };
    } catch (e) {
        console.error("[ExpressionUtils] Clone error:", e);
        showToast("Failed to clone emoji");
    }
}

export default definePlugin({
    name: "ExpressionUtils",
    description: "Manage emojis and stickers with ease. Adds context menu options to emojis and stickers.",
    author: [{ name: "LampDelivery", id: 650805815623680030n }, { name: "reyyan1", id: 797034673846747158n }, { name: "sapphire", id: 757982547861962752n }],
    id: "expressionutils",
    version: "1.0.0",

    async start() {
        try {
            // EmojiUtils
            const unpatch = patchMessageEmojiActionSheet();
            unpatches.push(unpatch);
            // StickerUtils
            const stickerUnpatch = patchStickerActionSheet();
            unpatches.push(stickerUnpatch);
        } catch (e) {
            console.error("[ExpressionUtils] Plugin initialization error:", e);
        }
    },

    stop() {
        for (const unpatch of unpatches) unpatch();
        unpatches.length = 0;
    },

    settings: ExpressionUtilsSettings,
});
