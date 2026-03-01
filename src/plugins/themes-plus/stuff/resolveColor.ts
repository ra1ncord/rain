import { tokens } from "@metro/common";
import { findByStoreName } from "@metro/wrappers";

const ThemeStore = findByStoreName("ThemeStore");

export default function resolveColor(color: string): string | undefined {
    if (color.startsWith("#")) return color;

    // Rain uses tokens.colors for semantic colors
    const semanticColor = (tokens.colors as any)[color];
    if (semanticColor) return semanticColor;

    return undefined;
}
