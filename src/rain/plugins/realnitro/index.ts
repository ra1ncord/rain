import { definePlugin } from "@plugins";
import settings from "./settings";
import transformEmoji from "./patches/transformEmoji";
import transformSticker from "./patches/transformSticker";
const patches: any[] = [];

export default definePlugin({
	name: "RealNitro",
	description: "Shows client-sided nitro expressions as real ones",
	author: [{ name: "j", id: 1356632712861192242n }],
	id: "realnitro",
	version: "v1.1.0",
	start() {
		patches.push(...transformEmoji);
		patches.push(...transformSticker);
	},
	stop() {
		for (const unpatch of patches) unpatch();
	},
	settings: settings,
});
