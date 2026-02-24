import { findByStoreName } from "@metro";

import { Message, Sticker } from "./def";
import { fakenitroSettings } from "./storage";
const { getCustomEmojiById } = findByStoreName("EmojiStore");
const { getGuildId } = findByStoreName("SelectedGuildStore");

// https://github.com/luimu64/nitro-spoof/blob/1bb75a2471c39669d590bfbabeb7b922672929f5/index.js#L25
const hasEmotesRegex = /<a?:(\w+):(\d+)>/i;

function extractUnusableEmojis(messageString: string, size: number) {
    const emojiStrings = messageString.matchAll(/<a?:(\w+):(\d+)>/gi);
    const emojiUrls = [];
    for (const emojiString of emojiStrings) {
        // Fetch required info about the emoji
        const emoji = getCustomEmojiById(emojiString[2]);
        // Check emoji usability
        if (emoji.guildId !== getGuildId() || emoji.animated) {
            // Remove emote from original msg
            messageString = messageString.replace(emojiString[0], "");
            const url =
				emoji?.url ??
				`https://cdn.discordapp.com/emojis/${emoji.id}.webp?size=44&animated=${emoji.animated}`;
            const animated = emoji.animated
                ? `&animated=${emoji.animated}`
                : "";
            // Add to emotes to send
            if (fakenitroSettings.hyperLink)
                emojiUrls.push(
                    `[${emoji.name}](${url.split("?")[0]}?size=${size}&name=${emoji.name}${animated})`,
                );
            else
                emojiUrls.push(
                    `${url.split("?")[0]}?size=${size}&name=${emoji.name}${animated}`,
                );
        }
    }

    return {
        newContent: messageString.trim(),
        extractedEmojis: emojiUrls,
    };
}

export function modifyIfNeeded(msg: Message) {
    if (!msg.content.match(hasEmotesRegex)) return;

    // Find all emojis from the captured message string and return object with emojiURLS and content
    const { newContent, extractedEmojis } = extractUnusableEmojis(
        msg.content,
        fakenitroSettings.emojiSize,
    );

    msg.content = newContent;

    if (extractedEmojis.length > 0)
        msg.content += "\n" + extractedEmojis.join("\ni");

    // Set invalidEmojis to empty to prevent Discord yelling to you about you not having nitro
    msg.invalidEmojis = [];
}

export function buildStickerURL(sticker: Sticker) {
    switch (sticker.format_type) {
        case 1:
            return `https://media.discordapp.net/stickers/${sticker.id}.png`;
        case 2:
            return `https://media.discordapp.net/stickers/${sticker.id}.png`; // apng - todo make xposed module for local conversion
        default:
            return `https://media.discordapp.net/stickers/${sticker.id}.gif`;
    }
}
