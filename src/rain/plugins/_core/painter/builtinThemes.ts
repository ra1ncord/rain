import { Theme } from "./types";


export const BUILTIN_RAINCORD_THEME: Theme = {
    manifest: {
        name: "rain",
        author: "LampDelivery",
        version: "1.0.0",
        license: "MIT",
    },
    plus: {
        version: 0,
        iconpack: "rosiecord-plumpy",
    },
    colors: {
        HEADER_PRIMARY: 0xdadcde,
        HEADER_SECONDARY: 0xcccccc,
        TEXT_NORMAL: 0xe5e5e5,
        TEXT_MUTED: 0xc1c1c1,
        MOBILE_TEXT_HEADING_PRIMARY: 0x7ee787,
        INTERACTIVE_HOVER: 0x403e6f,
        INTERACTIVE_ACTIVE: 0xf4f4f4,
        INTERACTIVE_MUTED: 0x53586b,
        BACKGROUND_PRIMARY: 0x111111,
        BACKGROUND_SECONDARY: 0x111111,
        BACKGROUND_SECONDARY_ALT: 0x212121,
        BACKGROUND_SURFACE_HIGH: 0x141414,
        CARD_BACKGROUND_DEFAULT: 0x1e1e1e,
        BACKGROUND_TERTIARY: 0x1e1e1e,
        BACKGROUND_ACCENT: 0x7e8ecc,
        BACKGROUND_FLOATING: 0x111111,
        BACKGROUND_MOBILE_PRIMARY: 0x141414,
        BACKGROUND_MOBILE_SECONDARY: 0x141414,
        BACKGROUND_NESTED_FLOATING: 0x111111,
        BACKGROUND_MESSAGE_HOVER: 0x212121,
        BACKGROUND_MODIFIER_HOVER: 0x212121,
        BACKGROUND_MODIFIER_ACTIVE: 0x212121,
        BACKGROUND_MODIFIER_SELECTED: 0x212121,
        BACKGROUND_MODIFIER_ACCENT: 0x141414,
        SCROLLBAR_THIN_THUMB: 0x212121,
        SCROLLBAR_THIN_TRACK: 0x000000,
        SCROLLBAR_AUTO_THUMB: 0x4e67ad,
        SCROLLBAR_AUTO_TRACK: 0x4e67ad,
        CHANNELTEXTAREA_BACKGROUND: 0x212121,
        CHANNELS_DEFAULT: 0x4e67ad,
        TEXT_LINK: 0x4e67ad,
        TEXT_DANGER: 0x7e8ecc,
        KEYBOARD: 0x111111,
        BG_BACKDROP: 0x000000b2,
        REDESIGN_BUTTON_SECONDARY_BACKGROUND: 0x191919,
        CHANNEL_ICON: 0xc4c4c4,
        CHAT_BACKGROUND: 0x141414,
        CARD_PRIMARY_BG: 0x212121,

        PRIMARY_500: 0x4e67ad,
        PRIMARY_100: 0xf4f4f4,
        PRIMARY_200: 0xd0cfef,
        PRIMARY_300: 0x4e67ad,
        PRIMARY_360: 0x7e8ecc,
        PRIMARY_400: 0x7e8ecc,
        PRIMARY_600: 0x141414,
        PRIMARY_630: 0x141414,
        PRIMARY_660: 0x141414,
        PRIMARY_700: 0x141414,
        PRIMARY_800: 0x141414,
        BLACK_500: 0x000000b2,
        BRAND_260: 0x4e67ad,
        BRAND_360: 0x4e67ad,
        BRAND_500: 0x7e8ecc,
        BRAND_560: 0x7e8ecc,
        YELLOW_300: 0x4e67ad,
        GREEN_600: 0x4e67ad,
        RED_400: 0x7e8ecc,
        WHITE_500: 0xe0deff,
        GREEN_360: 0x605d91,
        PLUM_23: 0x212121,
        PLUM_20: 0x111111,
        PLUM_18: 0x111111,
        PLUM_17: 0x141414,
        PLUM_16: 0x4e67ad,
        PLUM_13: 0x7e8ecc,
        PLUM_10: 0xc4c4c4,
        PLUM_3: 0xe5e5e5,
        PLUM_9: 0xe5e5e5,
    },
    background: {
        url: "https://raw.githubusercontent.com/rennpy/pyontheme/main/pyonpyon_bg.png",
        blur_radius: 0.1,
        overlay_alpha: 150,
    },
};

export const BUILTIN_THEMES: Record<string, Theme> = {
    rain: BUILTIN_RAINCORD_THEME,
};

export function getBuiltinTheme(name: string): Theme | undefined {
    return BUILTIN_THEMES[name.toLowerCase()];
}

export function getBuiltinThemeNames(): string[] {
    return Object.keys(BUILTIN_THEMES);
}

export function isBuiltinTheme(name: string): boolean {
    return name.toLowerCase() in BUILTIN_THEMES;
}
