import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { after } from "@api/patcher";
import { safeFetch } from "@lib/utils";
import { showToast } from "@api/ui/toasts";
import { definePlugin } from "@plugins";

import Settings from "./settings";

interface userBGData {
    endpoint: string;
    bucket: string;
    prefix: string;
    users: Record<string, string>;
}

const getUserBannerURL = findByProps("default", "getUserBannerURL");

let data: userBGData | undefined;
let pluginEnabled = false;
let unpatch: () => void;

function fetchData() {
    safeFetch("https://usrbg.is-hardly.online/users", { cache: "no-store" })
        .then(r => r?.json())
        .then(r => { data = r; })
        .catch(e => logger.error("Failed to fetch userBG data", e));
}

export { fetchData };

export default definePlugin({
    name: "UserBG",
    description: "https://github.com/Discord-Custom-Covers/usrbg#request-your-own-usrbg",
    author: [{ name: "sapphire", id: 757982547861962752n }, { name: "Rico040", id: 619474349845643275n }],
    id: "userbg",
    version: "v1.0.0",
    start() {
        pluginEnabled = true;
        fetchData();
        
        unpatch = after("getUserBannerURL", getUserBannerURL, ([user]) => {
            if (!pluginEnabled || !data?.users) return;
            const { endpoint, bucket, prefix, users } = data;
            const customBanner = Object.entries(users).find(([userId]) => userId === user?.id);
            if (user?.banner === undefined && customBanner) {
                const [userId, etag] = customBanner;
                return `${endpoint}/${bucket}/${prefix}${userId}?${etag}`;
            }
        });
    },
    stop() {
        pluginEnabled = false;
        unpatch?.();
        data = undefined;
    },
    settings: Settings,
});
