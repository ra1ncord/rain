import { definePlugin } from "@plugins";
import settings from "./settings";
import transformEmoji from "./patches/transformEmoji";
import transformSticker from "./patches/transformSticker";
const patches: any[] = [];

export default definePlugin({
	name: "Realmoji",
	description: "Shows FakeNitro emojis and stickers as real ones",
	author: [{ name: "redstonekasi", id: 265064055490871297n }, { name: "rico040", id: 619474349845643275n }, { name: "cocobo1", id: 767650984175992833n }, { name: "j", id: 1356632712861192242n }],
	id: "realmoji",
	version: "v1.0.0",
	start() {
		patches.push(...transformEmoji);
		patches.push(...transformSticker);
	},
	stop() {
		for (const unpatch of patches) unpatch();
	},
	settings: settings,
});
