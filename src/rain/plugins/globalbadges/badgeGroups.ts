import { BadgeGroupItem, CustomBadges } from "./types";

function convertWebpUrl(url: string): string {
    if (!url || typeof url !== "string") return url;

    // Convert Discord CDN webp to png
    if (url.includes("cdn.discordapp.com") && url.endsWith(".webp")) {
        return url.replace(".webp", ".png");
    }
    // For other webp URLs, try using a conversion service or just return as-is
    if (url.endsWith(".webp")) {
        try {
            const urlObj = new URL(url);
            if (!urlObj.searchParams.has("format")) {
                urlObj.searchParams.set("format", "png");
                return urlObj.toString();
            }
        } catch {
            return url;
        }
    }
    return url;
}

const badgeGroups = {
    customBadgesArray: (value: { badges: Array<{ badge: string; name: string }> }): BadgeGroupItem[] => {
        if (!value || !Array.isArray(value.badges)) return [];
        return value.badges.map(badge => ({
            type: badge.name,
            label: badge.name,
            uri: convertWebpUrl(badge.badge),
        }));
    },
    aliu: (value: CustomBadges["aliu"]) => {
        const badges: BadgeGroupItem[] = [
            {
                type: "dev",
                label: "Aliucord Dev",
                uri: convertWebpUrl("https://cdn.discordapp.com/emojis/860165259117199401.webp"),
            },
            {
                type: "donor",
                label: "Aliucord Donor",
                uri: convertWebpUrl("https://cdn.discordapp.com/emojis/859801776232202280.webp"),
            },
            {
                type: "contributor",
                label: "Aliucord Contributor",
                uri: convertWebpUrl("https://cdn.discordapp.com/emojis/886587553187246120.webp"),
            },
        ];
        return badges.filter(b => value?.[b.type]);
    },
    bd: (value: CustomBadges["bd"]) => {
        if (value?.dev) {
            return [{
                type: "dev",
                label: "BD Dev",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/betterdiscord/developer.png",
            }];
        }
        return [];
    },
    enmity: (value: CustomBadges["enmity"], user: any) => {
        const badges: BadgeGroupItem[] = [];
        if (value?.supporter?.data) {
            badges.push({
                type: "supporter",
                label: "Enmity Supporter",
                uri: convertWebpUrl(value.supporter.data.url.dark),
            });
        }
        if (value?.staff?.data) {
            badges.push({
                type: "staff",
                label: "Enmity Staff",
                uri: convertWebpUrl(value.staff.data.url.dark),
            });
        }
        if (value?.dev?.data) {
            badges.push({
                type: "dev",
                label: "Enmity Dev",
                uri: convertWebpUrl(value.dev.data.url.dark),
            });
        }
        if (value?.contributor?.data) {
            badges.push({
                type: "contributor",
                label: "Enmity Contributor",
                uri: convertWebpUrl(value.contributor.data.url.dark),
            });
        }
        if (value?.[user.id]?.data) {
            badges.push({
                type: "user",
                label: "Enmity User",
                uri: convertWebpUrl(value[user.id].data.url.dark),
            });
        }
        return badges;
    },
    goosemod: (value: CustomBadges["goosemod"]) => {
        const badges: BadgeGroupItem[] = [];
        if (value?.sponsor) {
            badges.push({
                type: "sponsor",
                label: "GooseMod Sponsor",
                uri: "https://goosemod.com/img/goose_globe.png",
            });
        }
        if (value?.dev) {
            badges.push({
                type: "dev",
                label: "GooseMod Dev",
                uri: "https://goosemod.com/img/goose_glitch.jpg",
            });
        }
        if (value?.translator) {
            badges.push({
                type: "translator",
                label: "GooseMod Translator",
                uri: "https://goosemod.com/img/goose_globe.png",
            });
        }
        return badges;
    },
    replugged: (value: CustomBadges["replugged"]) => {
        const badges: BadgeGroupItem[] = [];
        if (value?.developer) {
            badges.push({
                type: "developer",
                label: "Replugged Developer",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/developer.png",
            });
        }
        if (value?.staff) {
            badges.push({
                type: "staff",
                label: "Replugged Staff",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/staff.png",
            });
        }
        if (value?.support) {
            badges.push({
                type: "support",
                label: "Replugged Support",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/support.png",
            });
        }
        if (value?.contributor) {
            badges.push({
                type: "contributor",
                label: "Replugged Contributor",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/contributor.png",
            });
        }
        if (value?.translator) {
            badges.push({
                type: "translator",
                label: "Replugged Translator",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/translator.png",
            });
        }
        if (value?.hunter) {
            badges.push({
                type: "hunter",
                label: "Replugged Hunter",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/hunter.png",
            });
        }
        if (value?.early) {
            badges.push({
                type: "early",
                label: "Replugged Early Access",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/early.png",
            });
        }
        if (value?.booster) {
            badges.push({
                type: "booster",
                label: "Replugged Booster",
                uri: "https://raw.githubusercontent.com/domi-btnr/ClientModBadges-API/refs/heads/main/badges/replugged/booster.png",
            });
        }
        if (value?.custom?.name) {
            badges.push({
                type: "custom",
                label: value.custom.name,
                uri: value.custom.icon,
            });
        }
        return badges;
    },
    vencord: (value: CustomBadges["vencord"]) => {
        const badges: BadgeGroupItem[] = [];
        if (value?.contributor) {
            badges.push({
                type: "contributor",
                label: "Vencord Contributor",
                uri: "https://vencord.dev/assets/logo.png",
            });
        }
        if (Array.isArray(value?.cutie)) {
            value.cutie.forEach((cutie, idx) => {
                badges.push({
                    type: `cutie${idx}`,
                    label: cutie.tooltip,
                    uri: cutie.image,
                });
            });
        }
        return badges;
    },
    equicord: (value: CustomBadges["equicord"]) => {
        const badges: BadgeGroupItem[] = [];
        if (value?.contributor) {
            badges.push({
                type: "contributor",
                label: "Equicord Contributor",
                uri: "https://equicord.org/assets/icons/equicord/icon.png",
            });
        }
        if (Array.isArray(value?.cutie)) {
            value.cutie.forEach((cutie, idx) => {
                badges.push({
                    type: `cutie${idx}`,
                    label: cutie.tooltip,
                    uri: cutie.image,
                });
            });
        }
        return badges;
    },
    // raincord: (value: CustomBadges["raincord"]) => {
    //    if (!Array.isArray(value)) return [];
    //    return value.map(badge => ({
    //        type: badge.label,
    //        label: badge.label,
    //        uri: badge.url,
    //    }));
    // },
    reviewdb: (value: CustomBadges["reviewdb"]) => {
        if (!Array.isArray(value)) return [];
        return value.map(badge => ({
            type: badge.name,
            label: badge.name,
            uri: badge.icon,
        }));
    }
};

export default badgeGroups;
