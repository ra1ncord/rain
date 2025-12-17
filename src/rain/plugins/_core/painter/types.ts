import { ThemesPlusMeta } from "../painterplus/types";

export interface Theme {
    manifest: {
        name: string;
        author: string;
        version: string;
        license?: string;
        updater?: string;
    };
    simple_colors?: Record<string, number>;
    background?: {
        url: string;
        overlay_alpha?: number;
        blur_radius?: number;
    };
    fonts?: Record<string, string>;
    colors?: Record<string, number>;
    drawable_tints?: Record<string, number>;
    plus?: ThemesPlusMeta;
}

export interface RainTheme {
    name: string;
    description?: string;
    authors?: Array<{
        name: string;
        id?: string;
    }>;
    semanticColors?: Record<string, string[]>;
    rawColors?: Record<string, string>;
    background?: {
        url: string;
        blur?: number;
    };
    plus?: ThemesPlusMeta;
    spec?: number;
}

export interface ThemeFile {
    name: string;
    content: Theme;
    enabled: boolean;
}
