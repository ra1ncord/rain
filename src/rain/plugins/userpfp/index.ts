import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import Settings from "./settings";
import patcher, { fetchData,setPluginEnabled } from "./stuff/patcher";

export { fetchData };

let unpatch: (() => void) | undefined;

export default definePlugin({
    name: "UserPFP",
    description: "https://userpfp.github.io/UserPFP/#using-userpfp",
    author: [Developers.nexpid, Developers.kmmiio99o],
    id: "userpfp",
    version: "1.0.0",
    settings: Settings,
    start() {
        setPluginEnabled(true);
        try {
            unpatch = patcher();
        } catch (e) {
            logger.error("patch error", e);
            showToast("Failed to start UserPFP plugin");
        }
    },
    stop() {
        setPluginEnabled(false);
        if (unpatch) {
            unpatch();
            unpatch = undefined;
        }
    },
});
