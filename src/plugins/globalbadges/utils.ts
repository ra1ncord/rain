import { customBadgesSettings } from "./storage";
import { Badge } from "./types";

export let GlobalBadges: Record<string, Badge[]> = {};
export const serviceMap: Record<string, string> = {
    badgevault: "BadgeVault",
    nekocord: "Nekocord",
    reviewdb: "ReviewDB",
    aero: "Aero",
    aliucord: "Aliucord",
    raincord: "Raincord",
    velocity: "Velocity",
    enmity: "Enmity",
    paicord: "Paicord",
    vencord: "Vencord",
    equicord: "Equicord",
    bunny: "Bunny",
    goosemod: "GooseMod",
    replugged: "Replugged",
    betterdiscord: "BetterDiscord",
    vendroidenhanced: "VendroidEnhanced",
    revenge: "Revenge",
    record: "ReCord",
};

const blockedMods = ["raincord"];

export async function loadBadges() {
    const url = "https://badges.equicord.org/users";

    try {
        const response = await fetch(url, { cache: "no-cache" });
        const globalBadges = await response.json();
        const filteredUsers: Record<string, Badge[]> = {};

        for (const key in globalBadges.users) {
            filteredUsers[key] = globalBadges.users[key].filter((b: any) => {
                const { mod } = b;
                if (!mod) return false;
                if (blockedMods.includes(mod)) return false;

                const conditionalMods = {
                    aero: customBadgesSettings.showAero ?? true,
                    velocity: customBadgesSettings.showVelocity ?? true,
                    badgevault: customBadgesSettings.showCustom ?? true,
                    nekocord: customBadgesSettings.showNekocord ?? true,
                    reviewdb: customBadgesSettings.showReviewDB ?? true,
                    aliucord: customBadgesSettings.showAliucord ?? true,
                    enmity: customBadgesSettings.showEnmity ?? true,
                    paicord: customBadgesSettings.showPaicord ?? true,
                    vencord: customBadgesSettings.showVencord ?? true,
                    equicord: customBadgesSettings.showEquicord ?? true,
                    bunny: customBadgesSettings.showBunny ?? true,
                    goosemod: customBadgesSettings.showGooseMod ?? true,
                    replugged: customBadgesSettings.showReplugged ?? true,
                    betterdiscord: customBadgesSettings.showBetterDiscord ?? true,
                    vendroidenhanced: customBadgesSettings.showVendroidEnhanced ?? true,
                    revenge: customBadgesSettings.showRevenge ?? true,
                    record: customBadgesSettings.showReCord ?? true,
                };

                if (mod in conditionalMods && !conditionalMods[mod as keyof typeof conditionalMods]) return false;

                return true;
            }).map((b: any) => {
                const modFormatted = serviceMap[b.mod] || b.mod;
                let prefix = "";
                let suffix = "";
                if(customBadgesSettings.showModStyle === "prefix") { prefix = `${modFormatted} - `; }
                if(customBadgesSettings.showModStyle === "suffix") { suffix = ` - ${modFormatted}`; }

                const tooltip = prefix + b.tooltip + suffix;
                return {
                    ...b,
                    key: b.tooltip,
                    tooltip
                };
            });

            if (filteredUsers[key].length === 0) {
                delete filteredUsers[key];
            }
        }

        GlobalBadges = filteredUsers;
    } catch (e) {
        console.error("Failed to load global badges", e);
    }
}
