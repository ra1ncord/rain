import { definePlugin } from "@plugins";
import { unpatchAvatar, unpatchBanner} from "@plugins/picturelinks/patches/picturelinks"

const patches: any[] = []

export default definePlugin({
    name: "Picture Links",
    description: "Allows you to click on profile pictures and banners.",
    author: [{name: "redstonekasi" , id: 265064055490871297n }, { name: "Rico040", id: 619474349845643275n } ],
    id: "picturelinks",
    version: "v1.0.0",
    start() {
        patches.push(unpatchAvatar());
        patches.push(unpatchBanner());
    },
    stop() {
        console.log("patch value:", patches);
        for (const unpatch of patches) unpatch()
            
    },
})