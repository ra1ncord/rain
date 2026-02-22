import { definePlugin } from "@plugins";
import { unpatchAvatar, unpatchBanner } from "@plugins/picturelinks/patches/picturelinks";
import {Developers} from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "PictureLinks",
    description: "Allows you to click on profile pictures and banners.",
    author: [Developers.redstonekasi, Developers.rico040, Developers.reyyan1],
    id: "picturelinks",
    version: "1.0.0",
    start() {
        patches.push(unpatchAvatar());
        patches.push(unpatchBanner());
    },
    stop() {
        for (const unpatch of patches) unpatch();

    },
});
