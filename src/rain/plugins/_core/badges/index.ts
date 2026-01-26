import { after } from "@api/patcher";
import { onJsxCreate } from "@api/react/jsx";
import { findByNameLazy } from "@metro";
import { useEffect, useState } from "react";
import { definePlugin } from "@plugins";

interface Badge {
    label: string;
    url: string;
}

const useBadgesModule = findByNameLazy("useBadges", false);

export default definePlugin({
    name: "Badges",
    description: "Adds badges to a user's profile",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "badges",
    version: "v1.1.0",
    start() {
        let allBadges: { [x: string]: any; } | null = null;
        const badgeProps = {} as Record<string, any>;
        
        onJsxCreate("ProfileBadge", (component, ret) => {
            if (ret.props.id?.startsWith("rain-")) {
                const cachedProps = badgeProps[ret.props.id];
                if (cachedProps) {
                    ret.props.source = cachedProps.source;
                    ret.props.label = cachedProps.label;
                    ret.props.id = cachedProps.id;
                }
            }
        });
        
        onJsxCreate("RenderedBadge", (component, ret) => {
            if (ret.props.id?.startsWith("rain-")) {
                const cachedProps = badgeProps[ret.props.id];
                if (cachedProps) {
                    Object.assign(ret.props, cachedProps);
                }
            }
        });
        
        after("default", useBadgesModule, ([user], result) => {
            const [badges, setBadges] = useState<Badge[]>([]);
            
            useEffect(() => {
                if (!user) return;
                
                if (!allBadges) {
                    fetch("https://codeberg.org/raincord/badges/raw/branch/main/badges.json")
                        .then(r => r.json())
                        .then(data => {
                            allBadges = data;
                            //@ts-expect-error
                            setBadges(allBadges[user.userId] || []);
                        })
                } else {
                    setBadges(allBadges[user.userId] || []);
                }
            }, [user?.userId]);
            
            if (user && badges.length > 0) {
                badges.forEach((badge, i) => {
                    const badgeId = `rain-${user.userId}-${i}`;
                    
                    badgeProps[badgeId] = {
                        id: badgeId,
                        source: { uri: badge.url },
                        label: badge.label,
                        userId: user.userId,
                    };

                    result.unshift({
                        id: badgeId,
                        description: badge.label,
                        icon: " _",
                    });
                });
            }
        });
    }
});