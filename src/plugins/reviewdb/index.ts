import { waitForHydration } from "@api/storage";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

import { getAdmins } from "./lib/api";
import patchContextMenu from "./patches/patchContextMenu";
import patchProfile from "./patches/patchProfile";
import patchServer from "./patches/patchServer";
import patchSimplifiedProfile from "./patches/patchSimplifiedProfile";
import patchSegmentedProfile from "./patches/patchSegmentedProfile";
import Settings from "./Settings";
import { useReviewDBSettings } from "./storage";

const patches: (() => boolean)[] = [];
export const admins: any[] = [];

export default definePlugin({
    name: "ReviewDB",
    description: "Display and post reviews on user profiles.",
    author: [
        Developers.John,
        Contributors.maisy
    ],
    id: "reviewdb",
    version: "1.0.0",
    async start() {
        waitForHydration(useReviewDBSettings);
        patches.push(patchProfile());
        patches.push(patchSimplifiedProfile());
        patches.push(patchServer());
        patches.push(patchContextMenu());
		patches.push(patchSegmentedProfile())

        getAdmins().then(i => admins.push(...i));
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
    settings: Settings,
});
