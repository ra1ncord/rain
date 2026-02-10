import { after } from "@api/patcher";
import { onJsxCreate } from "@api/react/jsx";
import { findByNameLazy } from "@metro";
import { definePlugin } from "@plugins";

import badgeGroups from "./badgeGroups";
import CustomBadgesSettings from "./settings";
import { customBadgesSettings } from "./storage";
import { CustomBadges } from "./types";

const useBadgesModule = findByNameLazy("useBadges", false);

const customBadgesCache = new Map<string, CustomBadges>();
const pendingRequests = new Set<string>();

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
    author: [{ name: "wolfie", id: 347096063569559553n }],
    id: "globalbadges",
    version: "v1.0.0",
    start() {
        const badgeProps = {} as Record<string, any>;

        onJsxCreate("ProfileBadge", (component, ret) => {
            if (ret.props.id?.startsWith("gb-")) {
                const cachedProps = badgeProps[ret.props.id];
                if (cachedProps) {
                    ret.props.source = cachedProps.source;
                    ret.props.label = cachedProps.label;
                    ret.props.id = cachedProps.id;
                } else {
                }
            }
        });

        onJsxCreate("RenderBadge", (component, ret) => {
            if (ret.props.id?.startsWith("gb-")) {
                const cachedProps = badgeProps[ret.props.id];
                if (cachedProps) {
                    Object.assign(ret.props, cachedProps);
                } else {
                }
            }
        });

        patches.push(
            after("default", useBadgesModule, ([user], result) => {
                if (!user) return;
                const { userId } = user;
                const cached = customBadgesCache.get(userId);

                if (!cached) {
                    if (!pendingRequests.has(userId)) {
                        pendingRequests.add(userId);
                        fetchBadges(userId).then(badges => {
                            customBadgesCache.set(userId, badges);
                            pendingRequests.delete(userId);
                        });
                    }
                    return;
                }

                Object.entries(cached).forEach(([key, value]: [string, any]) => {
                    const isModBadge = ["aliu", "bd", "enmity", "goosemod", "replugged", "vencord", "equicord"].includes(key);
                    const isCustomBadge = ["customBadgesArray", "reviewdb"].includes(key);

                    if (customBadgesSettings.mods && isModBadge) return;
                    if (customBadgesSettings.customs && isCustomBadge) return;

                    const badgeGroupFn = badgeGroups[key];
                    if (!badgeGroupFn) return;

                    const badges = badgeGroupFn(value, user);
                    if (!badges || badges.length === 0) return;

                    badges.forEach(({ type, label, uri }) => {
                        const badgeId = `gb-${key}-${type}`;
                        badgeProps[badgeId] = {
                            id: badgeId,
                            source: { uri },
                            label,
                            userId: user.userId,
                        };

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
    },
    settings: CustomBadgesSettings,
});
