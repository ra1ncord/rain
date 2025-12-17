export const DEFAULT_OVERLAY_ALPHA = 150;

export const ALLOWED_RESOURCE_DOMAINS = [
    "github.com",
    "raw.githubusercontent.com",
    "gitlab.com",
    "cdn.discordapp.com",
    "media.discordapp.net",
    "i.imgur.com",
    "i.ibb.co",
];

export const THEME_KEYS = [
    "manifest",
    "simple_colors",
    "background",
    "fonts",
    "colors",
    "drawable_tints",
] as const;

export const SIMPLE_COLOR_NAMES = {
    accent: [
        "accent",
        "brand_500",
        "brand_560",
        "brand_600",
        "colorBrand",
    ],
    background: [
        "background",
        "colorBackgroundPrimary",
    ],
    background_secondary: [
        "background_secondary",
        "colorBackgroundSecondary",
    ],
} as const;

export const ERROR_MESSAGES = {
    INVALID_THEME: "Invalid theme format",
    THEME_NOT_FOUND: "Theme not found",
    FAILED_TO_APPLY: "Failed to apply theme",
    FAILED_TO_LOAD: "Failed to load theme",
} as const;
