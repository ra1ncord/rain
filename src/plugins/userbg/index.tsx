import { after } from "@api/patcher";
import { safeFetch } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

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
    author: [Contributors.sapphire, Contributors.rico040, Developers.kmmiio99o],
    id: "userbg",
    version: "1.0.0",
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
