import { definePlugin } from "@plugins";
import { initFonts } from "./fonts";
import { initThemes } from "./themes";

export default definePlugin({
    name: "Painter",
    description: "Customize Discord's appearance with themes and fonts",
    author: [{ name: "cocobo1", id: 767650984175992833n }, { name: "LampDelivery", id: 650805815623680030n }],
    id: "painter",
    version: "v1.0.0",
    async eagerStart(){
        initThemes();
    },
    async start() {
        initFonts();
    },
});