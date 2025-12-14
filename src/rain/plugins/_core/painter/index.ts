import { definePlugin } from "@plugins";
import { initFonts } from "./fonts";

export default definePlugin({
    name: "Painter",
    description: "Allows you to use custom themes and fonts",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "painter",
    version: "v1.0.0",
    async start() {
        initFonts()
        //initThemes()
    },
    eagerStart() {
    }
});