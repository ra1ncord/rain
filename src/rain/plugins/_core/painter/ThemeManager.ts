import { createStorage, awaitStorage } from "@lib/api/storage";
import { logger } from "@lib/utils/logger";
import { BUILTIN_THEMES } from "./builtinThemes";
import { updateThemeColors, clearThemeColors } from "./patches";
import { Theme, RainTheme, ThemeFile } from "./types";
import { ThemesPlusMeta } from "../painterplus/types";

export interface ThemeStorage {
    themes: Record<string, ThemeFile>;
    activeTheme?: string;
}

const defaultStorage: ThemeStorage = {
    themes: {},
};

export const themeStorage = createStorage<ThemeStorage>("themer/themes.json", {
    dflt: defaultStorage,
});

class ThemeManagerImpl {
    private themes: Map<string, ThemeFile> = new Map();
    private colorReplacements: Map<number, number> = new Map();
    private namedColorReplacements: Map<string, number> = new Map();
    private fontReplacements: Map<string, string> = new Map();

    async init() {
        try {
            await awaitStorage(themeStorage);

            for (const [name, content] of Object.entries(BUILTIN_THEMES)) {
                const themeFile: ThemeFile = {
                    name,
                    content: content as Theme,
                    enabled: false,
                };
                this.themes.set(name, themeFile);
            }

            for (const [name, theme] of Object.entries(themeStorage.themes || {})) {
                this.themes.set(name, theme);
            }

            logger.info(`[Themer] Loaded ${this.themes.size} themes (including ${Object.keys(BUILTIN_THEMES).length} built-in)`);
        } catch (error) {
            logger.error("[Themer] Failed to initialize", error);
        }
    }

    addTheme(theme: ThemeFile) {
        this.themes.set(theme.name, theme);
        themeStorage.themes[theme.name] = theme;
        logger.info(`[Themer] Added theme: ${theme.name}`);
    }

    removeTheme(name: string) {
        if (name.toLowerCase() in BUILTIN_THEMES) {
            logger.warn(`[Themer] Cannot remove built-in theme: ${name}`);
            return;
        }
        this.themes.delete(name);
        delete themeStorage.themes[name];
        logger.info(`[Themer] Removed theme: ${name}`);
    }

    isBuiltinTheme(name: string): boolean {
        return name.toLowerCase() in BUILTIN_THEMES;
    }

    getTheme(name: string): ThemeFile | undefined {
        return this.themes.get(name);
    }

    getAllThemes(): ThemeFile[] {
        return Array.from(this.themes.values());
    }

    applyTheme(theme: ThemeFile) {
        try {
            this.colorReplacements.clear();
            this.namedColorReplacements.clear();
            this.fontReplacements.clear();

            if (theme.content.simple_colors) {
                for (const [name, color] of Object.entries(theme.content.simple_colors)) {
                    this.colorReplacements.set(this.hashString(name), color);
                    this.namedColorReplacements.set(name, color);
                }
            }

            if (theme.content.colors) {
                for (const [name, color] of Object.entries(theme.content.colors)) {
                    this.colorReplacements.set(this.hashString(name), color);
                    this.namedColorReplacements.set(name, color);
                }
            }

            if (theme.content.fonts) {
                for (const [name, url] of Object.entries(theme.content.fonts)) {
                    this.fontReplacements.set(name, url);
                }
            }

            themeStorage.activeTheme = theme.name;
            logger.info(`[Themer] Applied theme: ${theme.name}`);

            const manifest = this.toColorManifest(theme.content);
            updateThemeColors(manifest);
        } catch (error) {
            logger.error(`[Themer] Failed to apply theme ${theme.name}`, error);
        }
    }

    clearTheme() {
        this.colorReplacements.clear();
        this.namedColorReplacements.clear();
        this.fontReplacements.clear();
        delete themeStorage.activeTheme;
        logger.info("[Themer] Cleared active theme");
        clearThemeColors();
    }

    getColorReplacement(color: number): number | undefined {
        return this.colorReplacements.get(color);
    }

    getColorReplacementByName(name: string): number | undefined {
        return this.namedColorReplacements.get(name);
    }

    getFontReplacement(fontName: string): string | undefined {
        return this.fontReplacements.get(fontName);
    }

    getActiveTheme(): ThemeFile | undefined {
        if (themeStorage.activeTheme) {
            return this.themes.get(themeStorage.activeTheme);
        }
        return undefined;
    }

    convertRainTheme(rainTheme: RainTheme): Theme {
        const author = rainTheme.authors?.[0]?.name || "Anonymous";

        const colors: Record<string, number> = {};
        if (rainTheme.semanticColors) {
            for (const [name, values] of Object.entries(rainTheme.semanticColors)) {
                const colorStr = values[0]; 
                if (colorStr) {
                    colors[name] = this.hexToDecimal(colorStr);
                }
            }
        }

        const rawColors: Record<string, number> = {};
        if (rainTheme.rawColors) {
            for (const [name, colorStr] of Object.entries(rainTheme.rawColors)) {
                rawColors[name] = this.hexToDecimal(colorStr);
            }
        }

        const allColors = { ...colors, ...rawColors };

        return {
            manifest: {
                name: rainTheme.name,
                author,
                version: rainTheme.plus?.version ? String(rainTheme.plus.version) : "1.0.0",
            },
            colors: allColors,
            background: rainTheme.background ? {
                url: rainTheme.background.url,
                blur_radius: rainTheme.background.blur || 0,
                overlay_alpha: 150, 
            } : undefined,
            plus: rainTheme.plus ? { ...rainTheme.plus, version: typeof rainTheme.plus.version === "string" ? Number(rainTheme.plus.version) : rainTheme.plus.version } : undefined,
        };
    }

    private hexToDecimal(hex: string): number {
        try {
            const cleanHex = typeof hex === "string" && hex.startsWith("#") ? hex.slice(1) : hex;
            return parseInt(cleanHex, 16);
        } catch {
            logger.warn(`[Themer] Failed to convert hex to decimal: ${hex}`);
            return 0;
        }
    }

    cleanup() {
        this.colorReplacements.clear();
        this.namedColorReplacements.clear();
        this.fontReplacements.clear();
        logger.info("[Themer] Cleaned up theme manager");
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; 
        }
        return hash;
    }

    private toColorManifest(content: Theme): { semanticColors?: Record<string, string[]>; rawColors?: Record<string, string | number>; plus?: ThemesPlusMeta } {
        const semanticColors: Record<string, string[]> = {};
        const rawColors: Record<string, string | number> = {};

        const pushColor = (name: string, value: number) => {
            semanticColors[name] = [this.numberToHex(value)];
            rawColors[name] = this.numberToHex(value);
        };

        if (content.simple_colors) {
            for (const [name, color] of Object.entries(content.simple_colors)) pushColor(name, color);
        }

        if (content.colors) {
            for (const [name, color] of Object.entries(content.colors)) pushColor(name, color);
        }

        return { semanticColors, rawColors, plus: content.plus };
    }

    private numberToHex(color: number): string {
        const hex = color.toString(16).padStart(color > 0xffffff ? 8 : 6, "0");
        return `#${hex}`;
    }
}

export const ThemeManager = new ThemeManagerImpl();

// Re-export types for backward compatibility
export type { Theme, RainTheme, ThemeFile };

