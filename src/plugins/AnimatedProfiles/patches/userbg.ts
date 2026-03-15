import { after } from "@api/patcher";
import { safeFetch } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";

const dataBannerURL = "https://usrbg.is-hardly.online/users";

let userBgData: userBGData | undefined;

const getUserBannerURL = findByProps("default", "getUserBannerURL");

interface userBGData {
    endpoint: string;
    bucket: string;
    prefix: string;
    users: Record<string, string>;
}

export async function fetchData() {
    try {
        const response = await safeFetch(dataBannerURL, { cache: "no-store" });
        userBgData = await response?.json();
    } catch (e) {
        logger.error("Failed to fetch UserBG data:", e);
    }
}

export function createUserBGPatcher(onEnabled: () => boolean) {
    return () => {
        const unpatch = after("getUserBannerURL", getUserBannerURL, ([user]) => {
            if (!onEnabled() || !userBgData?.users) return;
            const { endpoint, bucket, prefix, users } = userBgData;
            const customBanner = Object.entries(users).find(([userId]) => userId === user?.id);
            if (user?.banner === undefined && customBanner) {
                const [userId, etag] = customBanner;
                return `${endpoint}/${bucket}/${prefix}${userId}?${etag}`;
            }
        });
        return unpatch;
    };
}

export { userBgData };
