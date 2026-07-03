import { after } from "@api/patcher";
import { onJsxCreate } from "@api/react/jsx";
import { findByNameLazy } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import CustomBadgesSettings from "./settings";
import { customBadgesSettings } from "./storage";
import { BadgeProps } from "./types";
import { GlobalBadges, loadBadges } from "./utils";

const useBadgesModule = findByNameLazy("useBadges", false);
const REFRESH_INTERVAL = 1000 * 60 * 30;

let patches: Array<() => void> = [];
let intervalId: any;

export default definePlugin({
    name: "GlobalBadges",
    description: "Display custom badges from various Discord mod clients",
    author: [Contributors.wolfie, Contributors.thororen, Developers.cocobo1],
    id: "globalbadges",
    version: "2.0.0",
    async start() {
        await loadBadges();
        intervalId = setInterval(loadBadges, REFRESH_INTERVAL);

        const badgeProps = {} as Record<string, BadgeProps>;

        onJsxCreate("ProfileBadge", (component, ret) => {
            if (ret.props.id?.startsWith("gb-")) {
                const badgePropsCache = badgeProps[ret.props.id];
                if (badgePropsCache) {
                    ret.props.source = badgePropsCache.source;
                    ret.props.label = badgePropsCache.label;
                    ret.props.id = badgePropsCache.id;
                }
            }
        });

        onJsxCreate("RenderBadge", (component, ret) => {
            if (ret.props.id?.startsWith("gb-")) {
                const badgePropsCache = badgeProps[ret.props.id];
                if (badgePropsCache) {
                    Object.assign(ret.props, badgePropsCache);
                }
            }
        });

        patches.push(
            after("default", useBadgesModule, ([user], result) => {
                if (!user) return;
                const { userId } = user;
                const badges = GlobalBadges[userId];

                if (!badges) return;

                badges.forEach((b: any, index: number) => {
                    const badgeId = `gb-${b.mod}-${index}`;

                    badgeProps[badgeId] = {
                        id: badgeId,
                        source: { uri: b.badge },
                        label: b.tooltip,
                        userId
                    };

                    const badgeEntry = {
                        id: badgeId,
                        description: b.tooltip,
                        icon: " _",
                    };

                    if (customBadgesSettings.left) {
                        result.unshift(badgeEntry);
                    } else {
                        result.push(badgeEntry);
                    }
                });
            })
        );
    },
    stop() {
        for (const unpatch of patches) {
            if (typeof unpatch === "function") unpatch();
        }
        patches = [];
        if (intervalId) clearInterval(intervalId);
    },
    settings: CustomBadgesSettings,
});
