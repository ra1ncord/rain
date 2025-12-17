import { Theme } from "./types";
import { THEME_KEYS, DEFAULT_OVERLAY_ALPHA } from "./constants";
import { logger } from "@lib/utils/logger";

export class ThemeValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ThemeValidationError";
    }
}

export function validateTheme(theme: any): theme is Theme {
    try {
        if (!theme.manifest || typeof theme.manifest !== "object") {
            throw new ThemeValidationError("Missing or invalid manifest");
        }

        const { name, author, version } = theme.manifest;
        if (!name || !author || !version) {
            throw new ThemeValidationError("Missing required manifest fields (name, author, version)");
        }

        if (theme.simple_colors && typeof theme.simple_colors !== "object") {
            throw new ThemeValidationError("Invalid simple_colors section");
        }

        if (theme.background && typeof theme.background !== "object") {
            throw new ThemeValidationError("Invalid background section");
        }

        if (theme.fonts && typeof theme.fonts !== "object") {
            throw new ThemeValidationError("Invalid fonts section");
        }

        if (theme.colors && typeof theme.colors !== "object") {
            throw new ThemeValidationError("Invalid colors section");
        }

        if (theme.drawable_tints && typeof theme.drawable_tints !== "object") {
            throw new ThemeValidationError("Invalid drawable_tints section");
        }

        return true;
    } catch (error) {
        if (error instanceof ThemeValidationError) {
            logger.warn(`[Themer] Theme validation failed: ${error.message}`);
            throw error;
        }
        logger.error("[Themer] Unexpected validation error:", error);
        throw new ThemeValidationError("Unknown validation error");
    }
}

export function parseColorString(colorStr: string | undefined | null): number {
    if (typeof colorStr !== "string" || !colorStr.trim()) {
        throw new Error(`Invalid color format: ${colorStr}`);
    }
    try {
        if (colorStr.startsWith("#")) {
            return parseInt(colorStr.substring(1), 16);
        }
        if (!isNaN(Number(colorStr))) {
            return Number(colorStr);
        }
        throw new Error(`Invalid color format: ${colorStr}`);
    } catch (error) {
        logger.warn(`[Themer] Failed to parse color "${colorStr}"`);
        return 0xff000000; 
    }
}

export function colorToHex(color: number): string {
    return `#${color.toString(16).padStart(8, "0")}`;
}

export function cloneTheme(theme: Theme): Theme {
    return JSON.parse(JSON.stringify(theme));
}

export function mergeThemes(base: Theme, override: Partial<Theme>): Theme {
    return {
        manifest: {
            ...base.manifest,
            ...override.manifest,
        },
        simple_colors: {
            ...base.simple_colors,
            ...override.simple_colors,
        },
        background: {
            ...base.background,
            ...override.background,
        },
        fonts: {
            ...base.fonts,
            ...override.fonts,
        },
        colors: {
            ...base.colors,
            ...override.colors,
        },
        drawable_tints: {
            ...base.drawable_tints,
            ...override.drawable_tints,
        },
    } as Theme;
}

export function isValidColor(color: string | undefined | null): boolean {
    if (typeof color !== "string" || !color.trim()) return false;
    try {
        parseColorString(color);
        return true;
    } catch {
        return false;
    }
}

export function validateManifest(manifest: any): boolean {
    if (!manifest || typeof manifest !== "object") return false;
    if (!manifest.name || typeof manifest.name !== "string") return false;
    if (!manifest.author || typeof manifest.author !== "string") return false;
    if (!manifest.version || typeof manifest.version !== "string") return false;

    if (manifest.license && typeof manifest.license !== "string") return false;
    if (manifest.updater && typeof manifest.updater !== "string") return false;

    return true;
}

export function getDefaultTheme(name: string, author: string): Theme {
    return {
        manifest: {
            name,
            author,
            version: "1.0.0",
        },
        simple_colors: {},
        background: {
            url: "",
            overlay_alpha: DEFAULT_OVERLAY_ALPHA,
            blur_radius: 0,
        },
        fonts: {},
        colors: {},
        drawable_tints: {},
    };
}
