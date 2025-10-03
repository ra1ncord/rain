import { definePlugin } from "@plugins/index";
import { patchSettings, registerSection } from "./settings";
import { logger } from "@lib/logger"

export default definePlugin({
    manifest: {
        id: "settings",
        version: "1.0.0",
        display: {
            name: "Settings",
            description: "injects a settings menu into discord",
        }
    },
    start() {
        patchSettings()
        registerSection({
            name: "rain",
            items: [
                {
                    key: "RAIN",
                    title: () => "rain",
                    render: () => import("./pages/General")
                }
            ]
        });
    }
});