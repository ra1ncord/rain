import { Theme, ThemeFile, RainTheme, ThemeManager } from "./ThemeManager";
import { validateTheme, ThemeValidationError } from "./utils";
import { logger } from "@lib/utils/logger";

/**
 * Import a theme from JSON string
 */
export async function importThemeFromJSON(jsonString: string, themeName?: string): Promise<ThemeFile> {
    try {
        const parsed = JSON.parse(jsonString);

        if (isRainThemeFormat(parsed)) {
            return importRainTheme(parsed as RainTheme, themeName);
        }

        const content = parsed as Theme;

        if (!validateTheme(content)) {
            throw new ThemeValidationError("Invalid theme structure");
        }

        const name = themeName || content.manifest.name || "Imported Theme";

        return {
            name,
            content,
            enabled: false,
        };
    } catch (error) {
        if (error instanceof ThemeValidationError) {
            throw error;
        }
        logger.error("[Themer] Failed to import theme from JSON", error);
        throw new ThemeValidationError("Failed to parse theme JSON");
    }
}

/**
 * Import a Rain theme format directly
 */
export function importRainTheme(rainTheme: RainTheme, themeName?: string): ThemeFile {
    try {
        const converted = ThemeManager.convertRainTheme(rainTheme);
        const name = themeName || rainTheme.name || "Imported Rain Theme";

        return {
            name,
            content: converted,
            enabled: false,
        };
    } catch (error) {
        logger.error("[Themer] Failed to import Rain theme", error);
        throw new ThemeValidationError("Failed to import Rain theme");
    }
}

/**
 * Detect if a JSON object is in Rain theme format
 */
export function isRainThemeFormat(obj: any): boolean {
    return (
        obj.name &&
        typeof obj.name === "string" &&
        (obj.semanticColors || obj.rawColors || obj.spec === 2)
    );
}

/**
 * Import a theme from a URL
 */
export async function importThemeFromURL(url: string, themeName?: string): Promise<ThemeFile> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch theme: ${response.statusText}`);
        }

        const jsonString = await response.text();
        return importThemeFromJSON(jsonString, themeName);
    } catch (error) {
        logger.error(`[Themer] Failed to import theme from URL: ${url}`, error);
        throw new Error("Failed to import theme from URL");
    }
}

/**
 * Export a theme to JSON string
 */
export function exportThemeToJSON(theme: ThemeFile, pretty: boolean = true): string {
    try {
        if (pretty) {
            return JSON.stringify(theme.content, null, 2);
        } else {
            return JSON.stringify(theme.content);
        }
    } catch (error) {
        logger.error("[Themer] Failed to export theme", error);
        throw new Error("Failed to export theme");
    }
}

/**
 * Create a theme from a base theme with modifications
 */
export function createThemeFromBase(
    baseName: string,
    author: string,
    modifications: Partial<Theme>
): Theme {
    const base: Theme = {
        manifest: {
            name: baseName,
            author,
            version: "1.0.0",
        },
        simple_colors: {},
        background: {
            url: "",
            overlay_alpha: 150,
            blur_radius: 0,
        },
        fonts: {},
        colors: {},
        drawable_tints: {},
    };

    return {
        ...base,
        ...modifications,
        manifest: {
            ...base.manifest,
            ...modifications.manifest,
        },
    };
}

/**
 * Validates a theme URL
 */
export function isValidThemeURL(url: string): boolean {
    try {
        const parsedURL = new URL(url);
        return url.endsWith(".json") && (parsedURL.protocol === "http:" || parsedURL.protocol === "https:");
    } catch {
        return false;
    }
}

/**
 * Gets theme preview information
 */
export function getThemePreview(theme: ThemeFile): {
    name: string;
    author: string;
    version: string;
    colorCount: number;
    hasFonts: boolean;
    hasBackground: boolean;
} {
    return {
        name: theme.content.manifest.name,
        author: theme.content.manifest.author,
        version: theme.content.manifest.version,
        colorCount:
            Object.keys(theme.content.colors || {}).length +
            Object.keys(theme.content.simple_colors || {}).length,
        hasFonts: Object.keys(theme.content.fonts || {}).length > 0,
        hasBackground: !!theme.content.background?.url,
    };
}
