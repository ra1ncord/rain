import { waitForHydration } from "@api/storage";
import { definePlugin } from "@plugins";

import { startAll, stopAll } from "./features";
import settings from "./settings";
import { useCheeseburger } from "./storage";

export default definePlugin({
    name: "Cheeseburger",
    description: "Fuck discord",
    author: [{ name: "TonyskalYT", id: 1197324078739107881n }],
    id: "cheeseburger",
    version: "-69",
    async start() {
        await waitForHydration(useCheeseburger);
        await startAll();
    },
    stop() {
        stopAll();
    },
    settings,
});
