import { after } from "@api/patcher";
import { onJsxCreate } from "@api/react/jsx";
import { findByNameLazy } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

import badgeGroups from "./badgeGroups";
import CustomBadgesSettings from "./settings";
import { customBadgesSettings } from "./storage";
import { CustomBadges } from "./types";

const useBadgesModule = findByNameLazy("useBadges", false);

const customBadgesCache = new Map<string, CustomBadges>();
const pendingRequests = new Set<string>();
const badgeProps = new Map<string, Record<string, any>>();

let patches: Array<() => void> = [];

async function fetchBadges(userId: string): Promise<CustomBadges> {
    try {
        const res = await fetch(`https://api.obamabot.me/v2/text/badges?user=${userId}`);
        return await res.json();
    } catch {
        return {};
    }
}

export default definePlugin({
    name: "GlobalBadges",
    description: "Display custom badges from various Discord mod clients",
    author: [Contributors.wolfie],
    id: "globalbadges",
    version: "1.0.0",
    start() {
        onJsxCreate("ProfileBadge", (component, ret) => {
            if (ret.props.id?.startsWith("gb-")) {
                const cachedProps = badgeProps.get(ret.props.id);
                if (cachedProps) {
                    ret.props.source = cachedProps.source;
                    ret.props.label = cachedProps.label;
                    ret.props.id = cachedProps.id;
                }
            }
        });

        onJsxCreate("RenderBadge", (component, ret) => {
            if (ret.props.id?.startsWith("gb-")) {
                const cachedProps = badgeProps.get(ret.props.id);
                if (cachedProps) {
                    Object.assign(ret.props, cachedProps);
                }
            }
        });

        const processBadges = (badges: CustomBadges, user: { userId: string }) => {
            Object.entries(badges).forEach(([key, value]: [string, any]) => {
                const isModBadge = ["aliu", "bd", "enmity", "goosemod", "replugged", "vencord", "equicord"].includes(key);
                const isCustomBadge = ["customBadgesArray", "reviewdb"].includes(key);

                if (customBadgesSettings.mods && isModBadge) return;
                if (customBadgesSettings.customs && isCustomBadge) return;

                const badgeGroupFn = badgeGroups[key];
                if (!badgeGroupFn) return;

                const badgeItems = badgeGroupFn(value, user);
                if (!badgeItems || badgeItems.length === 0) return;

                badgeItems.forEach(({ type, label, uri }) => {
                    const badgeId = `gb-${key}-${type}`;
                    badgeProps.set(badgeId, {
                        id: badgeId,
                        source: { uri },
                        label,
                        userId: user.userId,
                    });
                });
            });
        };

        patches.push(
            after("default", useBadgesModule, ([user], result) => {
                if (!user) return;
                const { userId } = user;
                const badges = customBadgesCache.get(userId);

                if (!badges) {
                    if (!pendingRequests.has(userId)) {
                        pendingRequests.add(userId);
                        fetchBadges(userId).then(fetched => {
                            customBadgesCache.set(userId, fetched);
                            pendingRequests.delete(userId);
                            processBadges(fetched, user);
                            FluxDispatcher.dispatch({ type: "USER_UPDATE", user: { id: userId } });
                        });
                    }
                    return;
                }

                processBadges(badges, user);

                Object.entries(badges).forEach(([key, value]: [string, any]) => {
                    const isModBadge = ["aliu", "bd", "enmity", "goosemod", "replugged", "vencord", "equicord"].includes(key);
                    const isCustomBadge = ["customBadgesArray", "reviewdb"].includes(key);

                    if (customBadgesSettings.mods && isModBadge) return;
                    if (customBadgesSettings.customs && isCustomBadge) return;

                    const badgeGroupFn = badgeGroups[key];
                    if (!badgeGroupFn) return;

                    const badges = badgeGroupFn(value, user);
                    if (!badges || badges.length === 0) return;

                    badges.forEach(({ type, label }) => {
                        const badgeId = `gb-${key}-${type}`;

                        const badgeEntry = {
                            id: badgeId,
                            description: label,
                            icon: " _",
                        };

                        if (customBadgesSettings.left) {
                            result.unshift(badgeEntry);
                        } else {
                            result.push(badgeEntry);
                        }
                    });
                });
            })
        );
    },
    stop() {
        for (const unpatch of patches) {
            if (typeof unpatch === "function") unpatch();
        }
        patches = [];
        badgeProps.clear();
    },
    settings: CustomBadgesSettings,
});
