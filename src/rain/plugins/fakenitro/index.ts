import { definePlugin } from "@plugins";
import settings from "./settings";
import nitroChecks from "./patches/nitroChecks";
import sendMessage from "./patches/sendMessage";
import transformEmoji from "./patches/transformEmoji";
const patches: any[] = [];

export default definePlugin({
	name: "FakeNitro",
	description: "Gives you Client-Side Nitro",
	author: [{ name: "John", id: 780819226839220265n }],
	id: "fakenitro",
	version: "v1.0.0",
	start() {
		patches.push(...nitroChecks);
		patches.push(...sendMessage);
		patches.push(...transformEmoji);
	},
	stop() {
		for (const unpatch of patches) unpatch();
	},
	settings: settings,
});
