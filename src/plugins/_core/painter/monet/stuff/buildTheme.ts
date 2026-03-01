import { rawColors } from "@api/ui/components/color";
import { findByStoreNameLazy } from "@metro/wrappers";

import { useMonetSettings } from "../storage";
import type { Patches, PatchThing } from "../types";
import { getLABShade, parseColor } from "./colors";

const ThemeStore = findByStoreNameLazy("ThemeStore");

export function getDiscordTheme(): "dark" | "light" {
    try {
        const theme = ThemeStore?.theme;
        if (theme === "light") return "light";
    } catch {}
    return "dark";
}

export interface BuiltTheme {
    name: string;
    description?: string;
    authors?: { name: string; id: string }[];
    spec: 2;
    semanticColors?: Record<string, (string | null)[]>;
    rawColors?: Record<string, string>;
    background?: { url: string; alpha: number };
    plus?: {
        customOverlays: boolean;
        version: number;
        icons: Record<string, string | undefined>;
    };
}

export function build(patches: Patches): BuiltTheme {
    const raw = {} as Record<string, string>;
    const semantic = {} as Record<string, (string | null)[]>;
    const settings = useMonetSettings.getState();

    const theme: BuiltTheme = {
        name: "Material You Theme 2.0",
        description: "A Rain theme with Material You theming.",
        authors: [
            { name: "LampDelivery", id: "919266175219855360" },
            { name: "nexpid", id: "853550207039832084" },
        ],
        spec: 2,
    };

    const style = getDiscordTheme();

    const get = <T extends PatchThing<any>>(lk: T): T["both"] =>
        Object.assign(lk.both, style === "light" ? lk.light : lk.dark);
    const entries = <T extends object>(obj: T): [string, T[keyof T]][] => Object.entries(obj);

    const checkShouldPut = (shade: number, checks: string[]): boolean => {
        let shouldPut = true;
        for (const c of checks) {
            if (!shouldPut) break;
            if (c.startsWith(">=")) shouldPut = shade >= Number(c.slice(2));
            else if (c.startsWith("<=")) shouldPut = shade <= Number(c.slice(2));
            else if (c.startsWith(">")) shouldPut = shade > Number(c.slice(1));
            else if (c.startsWith("<")) shouldPut = shade < Number(c.slice(1));
        }
        return shouldPut;
    };

    if (patches.version === 3) {
        for (const [x, y] of entries(get(patches.replacers))) {
            const clr = parseColor(y.color);
            if (!clr) continue;

            for (
                const c of Object.keys(rawColors).filter(l => l.startsWith(`${x.split("_")[0]}_`))
            ) {
                const shade = Number(c.split("_")[1]);
                if (!checkShouldPut(shade, x.split("_").slice(1))) continue;

                const useShade = y.alternative
                    ? Math.floor((shade / 26) * 1000)
                    : shade;

                raw[c] = getLABShade(
                    clr,
                    y.base ? useShade + (500 - y.base) : useShade,
                    y.ratio,
                );
            }
        }
    }

    const rawPatches = get(patches.raw);
    for (const key of Object.keys(rawPatches)) {
        const clr = parseColor(rawPatches[key]);
        if (clr) raw[key] = clr;
    }

    // Fix PLUM shades that the "alternative" replacer pushes to pure black.
    // Map them to their corresponding PRIMARY raw values which compute correctly.
    if (raw["PRIMARY_700"]) raw["PLUM_23"] = raw["PRIMARY_700"];

    for (const key of Object.keys(patches.semantic.both)) {
        const clr = parseColor(rawPatches[key]);
        if (clr) semantic[key] = [clr, clr];
    }
    for (const key of Object.keys(patches.semantic.dark)) {
        const clr = parseColor(rawPatches[key]);
        if (semantic[key] && clr) semantic[key][0] = clr;
        else if (clr) semantic[key] = [clr];
    }
    for (const key of Object.keys(patches.semantic.light)) {
        const clr = parseColor(rawPatches[key]);
        if (semantic[key] && clr) semantic[key][1] = clr;
        else if (clr) semantic[key] = [null, clr];
    }

    // Add monet semantic defaults for Discord tokens not covered by raw replacers.
    // Includes both classic (BACKGROUND_*) and newer (BG_BASE_*) tokens to ensure
    // full coverage on all Discord versions.
    const semanticDefaults: Record<string, Record<string, string | undefined>> = {
        dark: {
            // Classic backgrounds
            "BACKGROUND_PRIMARY": raw["PRIMARY_600"],
            "BACKGROUND_SECONDARY": raw["PRIMARY_630"],
            "BACKGROUND_SECONDARY_ALT": raw["PRIMARY_700"],
            "BACKGROUND_TERTIARY": raw["PRIMARY_630"],
            "BACKGROUND_FLOATING": raw["PRIMARY_600"],
            "BACKGROUND_NESTED_FLOATING": raw["PRIMARY_600"],
            "BACKGROUND_MOBILE_PRIMARY": raw["PRIMARY_600"],
            "BACKGROUND_MOBILE_SECONDARY": raw["PRIMARY_630"],
            "BACKGROUND_MODIFIER_ACCENT": raw["PRIMARY_660"],
            "BACKGROUND_MODIFIER_ACTIVE": raw["PRIMARY_630"],
            "BACKGROUND_MODIFIER_HOVER": raw["PRIMARY_630"],
            "BACKGROUND_MODIFIER_SELECTED": raw["PRIMARY_630"],
            // New base backgrounds
            "BG_BASE_PRIMARY": raw["PRIMARY_600"],
            "BG_BASE_SECONDARY": raw["PRIMARY_700"],
            "BG_BASE_TERTIARY": raw["PRIMARY_660"],
            "BG_SURFACE_RAISED": raw["PRIMARY_630"],
            // Modifiers
            "BG_MOD_FAINT": raw["PRIMARY_460"],
            "BG_MOD_STRONG": raw["PRIMARY_530"],
            "BG_MOD_SUBTLE": raw["PRIMARY_630"],
            // Input / search bar
            "CHANNELTEXTAREA_BACKGROUND": raw["PRIMARY_660"],
            "REDESIGN_CHAT_INPUT_BACKGROUND": raw["PRIMARY_660"],
            "REDESIGN_ONLY_BACKGROUND_SUNKEN": raw["PRIMARY_700"],
            "CHAT_INPUT_CONTAINER_BACKGROUND": raw["PRIMARY_700"],
            "INPUT_BACKGROUND": raw["PRIMARY_700"],
            // Chat
            "CHAT_BACKGROUND": raw["PRIMARY_600"],
            // Cards
            "CARD_PRIMARY_BG": raw["PRIMARY_630"],
            "CARD_SECONDARY_BG": raw["PRIMARY_630"],
            // Buttons
            "REDESIGN_BUTTON_SECONDARY_BACKGROUND": raw["PRIMARY_630"],
            "REDESIGN_BUTTON_SECONDARY_BORDER": raw["PRIMARY_530"],
            "REDESIGN_BUTTON_TERTIARY_BACKGROUND": raw["PRIMARY_700"],
            // Activity cards
            "REDESIGN_ACTIVITY_CARD_BACKGROUND": raw["PRIMARY_630"],
        },
        light: {
            "BACKGROUND_PRIMARY": raw["PRIMARY_600"],
            "BACKGROUND_SECONDARY": raw["PRIMARY_630"],
            "BACKGROUND_SECONDARY_ALT": raw["PRIMARY_700"],
            "BACKGROUND_TERTIARY": raw["PRIMARY_630"],
            "BACKGROUND_FLOATING": raw["PRIMARY_600"],
            "BACKGROUND_NESTED_FLOATING": raw["PRIMARY_600"],
            "BACKGROUND_MOBILE_PRIMARY": raw["PRIMARY_600"],
            "BACKGROUND_MOBILE_SECONDARY": raw["PRIMARY_630"],
            "BACKGROUND_MODIFIER_ACCENT": raw["PRIMARY_660"],
            "BACKGROUND_MODIFIER_ACTIVE": raw["PRIMARY_630"],
            "BACKGROUND_MODIFIER_HOVER": raw["PRIMARY_630"],
            "BACKGROUND_MODIFIER_SELECTED": raw["PRIMARY_630"],
            "BG_BASE_PRIMARY": raw["PRIMARY_600"],
            "BG_BASE_SECONDARY": raw["PRIMARY_700"],
            "BG_BASE_TERTIARY": raw["PRIMARY_660"],
            "BG_SURFACE_RAISED": raw["PRIMARY_630"],
            "BG_MOD_FAINT": raw["PRIMARY_460"],
            "BG_MOD_STRONG": raw["PRIMARY_530"],
            "BG_MOD_SUBTLE": raw["PRIMARY_630"],
            "CHANNELTEXTAREA_BACKGROUND": raw["PRIMARY_660"],
            "REDESIGN_CHAT_INPUT_BACKGROUND": raw["PRIMARY_660"],
            "REDESIGN_ONLY_BACKGROUND_SUNKEN": raw["PRIMARY_700"],
            "CHAT_INPUT_CONTAINER_BACKGROUND": raw["PRIMARY_700"],
            "INPUT_BACKGROUND": raw["PRIMARY_700"],
            "CHAT_BACKGROUND": raw["PRIMARY_600"],
            "CARD_PRIMARY_BG": raw["PRIMARY_630"],
            "CARD_SECONDARY_BG": raw["PRIMARY_630"],
            "REDESIGN_BUTTON_SECONDARY_BACKGROUND": raw["PRIMARY_630"],
            "REDESIGN_BUTTON_SECONDARY_BORDER": raw["PRIMARY_530"],
            "REDESIGN_BUTTON_TERTIARY_BACKGROUND": raw["PRIMARY_700"],
            "REDESIGN_ACTIVITY_CARD_BACKGROUND": raw["PRIMARY_630"],
        },
    };

    const defaults = semanticDefaults[style] ?? {};
    for (const [key, value] of Object.entries(defaults)) {
        if (value && !semantic[key]) {
            semantic[key] = style === "dark" ? [value] : [null, value];
        }
    }

    if (settings.config.wallpaper !== "none") {
        theme.background = {
            url: settings.config.wallpaper,
            alpha: 1,
        };
    }

    if (patches.version === 3 && patches.plus) {
        theme.plus = {
            customOverlays: true,
            version: 0,
            icons: {},
        };

        const icons: Record<string, string | undefined> = {};
        for (const key of Object.keys(get(patches.plus.icons))) {
            icons[key] = parseColor(key);
        }
        theme.plus.icons = icons;
    }

    theme.semanticColors = semantic as any;
    theme.rawColors = raw;

    return JSON.parse(JSON.stringify(theme));
}
