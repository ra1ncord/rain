import { definePlugin } from "@plugins";
import patchProfile from "./patches/patchProfile";
import patchSimplifiedProfile from "./patches/patchSimplifiedProfile";
import patchServer from "./patches/patchServer";
import patchContextMenu from "./patches/patchContextMenu";
import { getAdmins } from "./lib/api";
import Settings from "./Settings";
import { waitForHydration } from "@api/storage";
import { useReviewDBSettings } from "./storage";

let patches: (() => boolean)[] = [];
export const admins: any[] = [];

export default definePlugin({
    name: "ReviewDB",
    description: "Display and post reviews on user profiles.",
    author: [
        { name: "John", id: 780819226839220265n },
        { name: "maisy", id: 257109471589957632n },
    ],
    id: "reviewdb",
    version: "v1.0.0",
    async start() {
        await waitForHydration(useReviewDBSettings);
        patches.push(patchProfile());
        patches.push(patchSimplifiedProfile());
        patches.push(patchServer());
        patches.push(patchContextMenu());

        getAdmins().then((i) => admins.push(...i));
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
    settings: Settings,
});
