import { instead } from "@api/patcher";
import { safeFetch } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { findByProps, findByStoreName } from "@metro";

import type { DataFile } from "../types";

const dataURL = "https://userpfp.github.io/UserPFP/source/data.json";

let data: DataFile | undefined;
let pluginEnabled = false;
let dataInterval: ReturnType<typeof setInterval> | undefined;

export function setPluginEnabled(enabled: boolean) {
    pluginEnabled = enabled;
}

export function fetchData() {
    safeFetch(dataURL, { headers: { "cache-control": "max-age=1800" } })
        .then(r => r?.json())
        .then(r => { data = r; })
        .catch(e => logger.error("fetch error", e));
}

function getCustomAvatar(id: string, isStatic?: boolean) {
    if (!data?.avatars?.[id]) return;

    const avatar = data.avatars[id];
    if (isStatic && urlExt(avatar) === "gif") {
        return avatar.replace(".gif", ".png");
    }
    return avatar;
}

function urlExt(url: string) {
    return new URL(url).pathname.split(".").slice(-1)[0];
}

export default () => {
    const patches: (() => void)[] = [];

    fetchData();

    const avatarStuff = findByProps("getUserAvatarURL", "getUserAvatarSource");
    const UserStore = findByStoreName("UserStore");

    dataInterval = setInterval(() => fetchData(), 1000 * 60 * 60);

    patches.push(
        instead("getUser", UserStore, (args, orig) => {
            const ret = orig(...args);
            if (!pluginEnabled || !data?.avatars?.[args[0]]) return ret;
            const ext = data.avatars[args[0]] && urlExt(data.avatars[args[0]]);
            if (ext === "gif" && ret) {
                const avatar = ret.avatar ?? "0";
                ret.avatar = !avatar.startsWith("a_") ? `a_${avatar}` : avatar;
            }
            return ret;
        }),
    );

    patches.push(
        instead(
            "getUserAvatarURL",
            avatarStuff,
            (args, orig) => {
                const custom = pluginEnabled ? getCustomAvatar(args[0].id, !args[1]) : undefined;
                return custom ?? orig(...args);
            },
        ),
    );

    patches.push(
        instead("getUserAvatarSource", avatarStuff, (args, orig) => {
            if (!pluginEnabled) return orig(...args);
            const custom = getCustomAvatar(args[0].id, !args[1]);
            if (!custom) return orig(...args);
            return { uri: custom };
        }),
    );

    return () => {
        for (const x of patches) {
            x();
        }
        if (dataInterval) {
            clearInterval(dataInterval);
            dataInterval = undefined;
        }
    };
};
