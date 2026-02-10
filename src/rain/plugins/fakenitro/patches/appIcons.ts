import { after } from "@api/patcher";
import { findByProps } from "@metro";

const iconConstants = findByProps("getOfficialAlternateIcons", "getLimitedAlternateIcons");

// when using this, it killed names so this fixes it lol
function ensureIconName(icon: any) {
    if (!icon) return icon;

    if (!icon.name && icon.id) {
        let name = icon.id;

        name = name.replace(/Icon$/i, "");

        name = name.replace(/_/g, " ");

        name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
        name = name.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

        name = name
            .toLowerCase()
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
            .trim();

        icon.name = name;
    }

    return icon;
}

export default [
    after("getOfficialAlternateIcons", iconConstants, (_, ret) => {
        return ret.map((icon: any) => {
            icon = ensureIconName(icon);
            return { ...icon, isPremium: false };
        });
    }),

    after("getLimitedAlternateIcons", iconConstants, (_, ret) => {
        return ret.map((icon: any) => {
            icon = ensureIconName(icon);
            return { ...icon, isPremium: false };
        });
    }),

    after("getIcons", iconConstants, (_, ret) => {
        return ret.map((icon: any) => {
            icon = ensureIconName(icon);
            return { ...icon, isPremium: false };
        });
    }),

    after("getIconById", iconConstants, (_, ret) => {
        if (ret) {
            ret = ensureIconName(ret);
            ret.isPremium = false;
        }
        return ret;
    }),

    after("getDefaultIcon", iconConstants, (_, ret) => {
        if (ret) {
            ret = ensureIconName(ret);
            ret.isPremium = false;
        }
        return ret;
    }),
];
