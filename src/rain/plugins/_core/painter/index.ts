import { definePlugin } from "@plugins";
import { initFonts } from "./fonts";

export default definePlugin({
    name: "Painter",
    description: "Customize Discord's appearance with themes and fonts",
    author: [{ name: "LampDelivery", id: 650805815623680030n }],
    id: "painter",
    version: "v1.0.0",
    async start() {
        initFonts();
    },
});