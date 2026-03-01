import { waitForHydration } from "@api/storage";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import patchProfile from "./patches/patchProfile";
import patchSimplifiedProfile from "./patches/patchSimplifiedProfile";
import Settings from "./Settings";
import { useSongSpotlightSettings } from "./storage";

const patches: (() => boolean)[] = [];

export default definePlugin({
    name: "Song Spotlight",
    description: "Show your top Last.fm tracks on your Discord profile.",
    author: [Developers.LampDelivery],
    id: "songspotlight",
    version: "1.0.0",
    async start() {
        await waitForHydration(useSongSpotlightSettings);
        patches.push(patchProfile());
        patches.push(patchSimplifiedProfile());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: Settings,
});
