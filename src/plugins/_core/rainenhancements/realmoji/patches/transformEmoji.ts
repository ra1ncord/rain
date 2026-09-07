import { after, before } from "@api/patcher";
import { findByName } from "@metro";
import { EmojiStore } from "@metro/common/stores";

import { rainenhancementsSettings } from "../../storage";
import { Embed, Message } from "../def";

const { getCustomEmojiById } = EmojiStore;
const RowManager = findByName("RowManager");
const emojiRegex = /https:\/\/cdn.discordapp.com\/emojis\/(\d+)\.\w+/;

export default [
    before("generate", RowManager.prototype, ([data]) => {
        if (data.rowType !== 1 || !rainenhancementsSettings.transformEmoji) return;

        const content = data.message.content as string;
        if (!content?.length) return;
        // Parse complete Markdown links before replacing their rendered nodes.
        if (!emojiRegex.test(content)) return;

        const embeds = data.message.embeds as Embed[];
        for (let i = 0; i < embeds.length; i++) {
            const embed = embeds[i];
            if (embed.type === "image" && embed.url?.match(emojiRegex))
                embeds.splice(i--, 1);
        }

        data.message.__rainenhancements = true;
    }),
    after("generate", RowManager.prototype, ([data], row) => {
        if (data.rowType !== 1 || data.message.__rainenhancements !== true || !rainenhancementsSettings.transformEmoji) return;
        const { content } = row.message as Message;
        if (!Array.isArray(content)) return;

        const jumbo = content.every(
            c =>
                (c.type === "link" && c.target.match(emojiRegex)) ||
				(c.type === "text" && c.content === " "),
        );

        for (let i = 0; i < content.length; i++) {
            const el = content[i];
            if (el.type !== "link") continue;

            const match = el.target.match(emojiRegex);
            if (!match) continue;
            const e = el.target.split("&");
            const url = `${match[0]}?size=128`;
            const emoji = getCustomEmojiById(match[1]);
            let emojiName = emoji?.name;
            if (emojiName === undefined) emojiName = "<rainenhancements>";
            if (e[1]?.startsWith("name")) {
                emojiName = e[1].replace("name=", "");
            }
            content[i] = {
                type: "customEmoji",
                id: match[1],
                alt: emojiName + "_rainenhancements",
                src: el.target.includes("animated=true")
                    ? url.replace("webp", "gif")
                    : url,
                frozenSrc: url.replace("gif", "webp"),
                jumboable: jumbo ? true : undefined,
            };
        }
    }),
];
