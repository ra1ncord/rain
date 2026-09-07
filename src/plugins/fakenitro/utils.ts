
import { EmojiStore, SelectedGuildStore } from "@metro/common/stores";

import { Message, Sticker } from "./def";
import { fakenitroSettings } from "./storage";

const { getCustomEmojiById } = EmojiStore;
const { getGuildId } = SelectedGuildStore;

// https://github.com/luimu64/nitro-spoof/blob/1bb75a2471c39669d590bfbabeb7b922672929f5/index.js#L25
const hasEmotesRegex = /<a?:(\w+):(\d+)>/i;

function replaceUnusableEmojis(messageString: string, size: number) {
    return messageString.replace(/<a?:(\w+):(\d+)>/gi, (original, _name, id) => {
        const emoji = getCustomEmojiById(id);
        if (emoji.guildId === undefined) return original;
        if (emoji.guildId === getGuildId() && !emoji.animated) return original;

        const url = emoji.url ?? `https://cdn.discordapp.com/emojis/${emoji.id}.webp`;
        const animated = emoji.animated ? "&animated=true" : "";
        const target = `${url.split("?")[0]}?size=${size}&name=${emoji.name}${animated}`;
        return fakenitroSettings.hyperLink ? `[${emoji.name}](${target})` : target;
    });
}

export function modifyIfNeeded(msg: Message) {
    if (!msg.content.match(hasEmotesRegex)) return;

    // Preserve emoji positions and all surrounding Markdown/whitespace.
    msg.content = replaceUnusableEmojis(msg.content, fakenitroSettings.emojiSize);
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
