import { definePlugin } from "@plugins";
import settings from "./settings";
import nitroChecks from "./patches/nitroChecks";
import sendMessage from "./patches/sendMessage";
import transformEmoji from "./patches/transformEmoji";
import transformSticker from "@plugins/fakenitro/patches/transformSticker";
import appIcons from "./patches/appIcons";

const patches: any[] = [];

export default definePlugin({
	name: "FakeNitro",
	description: "Gives you Client-Side Nitro",
	author: [{ name: "John", id: 780819226839220265n }],
	id: "fakenitro",
	version: "v1.1.0",
	start() {
		patches.push(...nitroChecks);
		patches.push(...sendMessage);
		patches.push(...transformEmoji);
		patches.push(...transformSticker);
		patches.push(...appIcons);
	},
	stop() {
		for (const unpatch of patches) unpatch();
	},
	settings: settings,
});
