import { after, before } from "@api/patcher";
import { findByName, findByStoreName } from "@metro";
import { Embed, Message } from "../def";
import {fakenitroSettings} from "@plugins/fakenitro/storage";

const { getCustomEmojiById } = findByStoreName("EmojiStore");
const RowManager = findByName("RowManager");
const emojiRegex = /https:\/\/cdn.discordapp.com\/emojis\/(\d+)\.\w+/;

export default [
	before("generate", RowManager.prototype, ([data]) => {
		if (data.rowType !== 1 || !fakenitroSettings.transformEmoji) return;

		let content = data.message.content as string;
		if (!content?.length) return;
		const matchIndex = content.match(emojiRegex)?.index;
		if (matchIndex === undefined) return;
		const emojis = content.slice(matchIndex).trim().split("\n");
		if (!emojis.every((s) => s.match(emojiRegex))) return;
		content = content.slice(0, matchIndex);

		while (content.indexOf("  ") !== -1)
			content = content.replace("  ", ` ${emojis.shift()} `);

		content = content.trim();
		if (emojis.length) content += ` ${emojis.join(" ")}`;

		const embeds = data.message.embeds as Embed[];
		for (let i = 0; i < embeds.length; i++) {
			const embed = embeds[i];
			if (embed.type === "image" && embed.url?.match(emojiRegex))
				embeds.splice(i--, 1);
		}

		data.message.content = content;
		data.__realmoji = true;
	}),
	after("generate", RowManager.prototype, ([data], row) => {
		if (data.rowType !== 1 || data.__realmoji !== true || !fakenitroSettings.transformEmoji) return;
		const { content } = row.message as Message;
		if (!Array.isArray(content)) return;

		const jumbo = content.every(
			(c) =>
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
			if (emojiName === undefined) emojiName = "<realmoji>";
			if (e[1]?.startsWith("name")) {
				emojiName = e[1].replace("name=", "");
			}
			content[i] = {
				type: "customEmoji",
				id: match[1],
				alt: emojiName,
				src: el.target.includes("animated=true")
					? url.replace("webp", "gif")
					: url,
				frozenSrc: url.replace("gif", "webp"),
				jumboable: jumbo ? true : undefined,
			};
		}
	}),
];
