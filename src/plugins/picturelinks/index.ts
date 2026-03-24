import { definePlugin } from "@plugins";
import { unpatchAvatar, unpatchBanner } from "@plugins/picturelinks/patches/picturelinks";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

const patches: any[] = [];

export default definePlugin({
    name: "PictureLinks",
    description: Strings.PLUGINS.CUSTOM.PICTURELINKS.DESCRIPTION,
    author: [Contributors.redstonekasi, Contributors.rico040, Developers.reyyan1],
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
