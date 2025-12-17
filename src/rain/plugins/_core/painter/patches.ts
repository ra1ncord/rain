import { after, before, instead } from "spitroast";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro/wrappers";
import { constants, tokens } from "@metro/common";
import { findByProps as findByPropsMetro } from "@metro";
import chroma from "chroma-js";
import { ThemeManager } from "./ThemeManager";
import { parseThemeManifest } from "./colors/parser";

const patches: Array<() => void> = [];

type InternalColorDef = {
    raw: Record<string, string>;
    semantic: Record<string, { value: string; opacity: number }>;
    reference: string;
    spec: number;
};

const tokenReference = findByProps("SemanticColor");
const origRawColor = { ...(tokenReference?.RawColor ?? {}) };
const AppearanceManager = findByPropsMetro("updateTheme");
const ThemeStore = findByPropsMetro("theme");
const FormDivider = findByPropsMetro("DIVIDER_COLORS");

const _colorRef: {
    key: "darker";
    current: InternalColorDef | null;
    lastSetDiscordTheme: string;
} = {
    key: "darker",
    current: null,
    lastSetDiscordTheme: ThemeStore?.theme ?? "darker",
};

export function patchTheme() {
    patchDefinitionAndResolver();
    patchRawColors();
    patchFontLoading();
    patchDrawableTinting();
    logger.info("[Themer] Patches applied");
}

function patchDefinitionAndResolver() {
    try {
        if (!tokenReference || !tokenReference.default) {
            logger.warn("[Themer] No color token reference found");
            return;
        }

        Object.keys(tokenReference.RawColor ?? {}).forEach(key => {
            Object.defineProperty(tokenReference.RawColor, key, {
                configurable: true,
                enumerable: true,
                get: () => _colorRef.current?.raw[key] ?? origRawColor[key],
            });
        });

        const resolver = tokenReference.default.meta ?? tokenReference.default.internal;
        if (!resolver || typeof resolver.resolveSemanticColor !== "function") {
            logger.warn("[Themer] Failed to locate color resolver; semantic colors will not be themed");
            return;
        }

        const symProp = (() => {
            const sym = Object.getOwnPropertySymbols(resolver.SemanticColor?.BACKGROUND_PRIMARY ?? {})[0];
            return sym;
        })();

        const unpatches: Array<() => void> = [];

        unpatches.push(instead("resolveSemanticColor", resolver, (args: any[], orig: any) => {
                if (!_colorRef.current) return orig(...args);
                if (args[0] !== _colorRef.key) return orig(...args);

                const colorObj = args[1];
                const propName = symProp ? colorObj[symProp] : undefined;
                const colorDef = tokenReference.SemanticColor?.[propName ?? ""];
                const defForTheme = colorDef?.[_colorRef.key];
                const name = propName ?? "";

                const semantic = _colorRef.current.semantic[name];
                if (semantic) return semantic.opacity === 1 ? semantic.value : chroma(semantic.value).alpha(semantic.opacity).hex();

                const rawName = defForTheme?.raw;
                const rawValue = rawName ? _colorRef.current.raw[rawName] : undefined;
                if (rawValue) {
                    const opacity = defForTheme?.opacity ?? 1;
                    return opacity === 1 ? rawValue : chroma(rawValue).alpha(opacity).hex();
                }

                return orig(...args);
        }));

        if (AppearanceManager && typeof (AppearanceManager as any).updateTheme === "function") {
            unpatches.push(before("updateTheme", AppearanceManager, ([theme]) => {
                if (theme === _colorRef.key) return [_colorRef.key];
            }));
        } else {
            logger.warn("[Themer] AppearanceManager.updateTheme is not available; skipping theme update hook");
        }

        unpatches.push(() => {
                Object.defineProperty(tokenReference, "RawColor", {
                    configurable: true,
                    writable: true,
                    value: origRawColor,
                });
        });

        patches.push(() => unpatches.forEach(p => typeof p === "function" && p()));
    } catch (error) {
        logger.error("[Themer] Failed to patch resolver", error);
    }
}

function patchFontLoading() {
    try {
        patches.push(() => {
            logger.info("[Themer] Unpatched font loading");
        });
    } catch (error) {
        logger.error("[Themer] Failed to patch font loading", error);
    }
}

function patchDrawableTinting() {
    try {
        patches.push(() => {
            logger.info("[Themer] Unpatched drawable tinting");
        });
    } catch (error) {
        logger.error("[Themer] Failed to patch drawable tinting", error);
    }
}

function patchRawColors() {
    try {
        const colorModule = findByProps("SemanticColor");
        const rawColors = colorModule?.default?.unsafe_rawColors ?? constants?.Colors;

        if (!rawColors) {
            logger.warn("[Themer] Failed to locate raw colors; raw color theming skipped");
            return;
        }

        const proxy = new Proxy(rawColors, {
            get(target, prop, receiver) {
                const key = typeof prop === "string" ? prop : undefined;
                if (key) {
                    const replacement = _colorRef.current?.raw[key];
                    if (replacement !== undefined) {
                        logger.info?.(`[Themer] RawColor hit: ${key} -> ${replacement}`);
                        return replacement;
                    }
                }
                return Reflect.get(target, prop, receiver);
            },
        });

        if (colorModule?.default) colorModule.default.unsafe_rawColors = proxy;
        if (constants?.Colors) (constants as any).Colors = proxy;
        if ((tokens as any)?.unsafe_rawColors) (tokens as any).unsafe_rawColors = proxy;

        patches.push(() => {
            if (colorModule?.default && rawColors) colorModule.default.unsafe_rawColors = rawColors;
            if (constants?.Colors && rawColors) (constants as any).Colors = rawColors;
            if ((tokens as any)?.unsafe_rawColors && rawColors) (tokens as any).unsafe_rawColors = rawColors;
            logger.info("[Themer] Unpatched raw colors");
        });
    } catch (error) {
        logger.error("[Themer] Failed to patch raw colors", error);
    }
}

function colorToHex(color: number): string {
    const hex = color.toString(16).padStart(8, "0");
    return `#${hex}`;
}

function normalizeColor(value: unknown): string {
    if (typeof value === "number") {
        const hex = value.toString(16).padStart(value > 0xffffff ? 8 : 6, "0");
        return `#${hex}`;
    }
    if (typeof value === "string") {
        if (typeof value === "string" && value.startsWith("#")) return value;
        return `#${value}`;
    }
    return "";
}

function toInternal(manifest?: { semanticColors?: Record<string, string[]>; rawColors?: Record<string, string | number> }): InternalColorDef | null {
    if (!manifest) return null;
    const raw: Record<string, string> = {};
    const semantic: Record<string, { value: string; opacity: number }> = {};

    if (manifest.rawColors) {
        for (const [k, v] of Object.entries(manifest.rawColors)) {
            raw[k] = normalizeColor(v);
        }
    }

    if (manifest.semanticColors) {
        for (const [k, arr] of Object.entries(manifest.semanticColors)) {
            const val = arr?.[0];
            if (!val) continue;
            semantic[k] = { value: normalizeColor(val), opacity: 1 };
        }
    }

    return {
        raw,
        semantic,
        reference: "darker",
        spec: 2,
    };
}

export function updateThemeColors(manifest?: any | null) {
    try {
        try {
            const { applyPlus } = require("../painterplus/plus");
            if (manifest && applyPlus) applyPlus(manifest);
        } catch {}

        const parsed = parseThemeManifest(manifest ?? undefined);
        const semanticColors: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(parsed.semanticColors ?? {} as Record<string, string>)) {
            semanticColors[k] = [v as string];
        }
        const internal = toInternal({
            semanticColors,
            rawColors: (parsed.colors ?? {}) as Record<string, string | number>,
        });

        if (!tokenReference?.SemanticColor || !tokenReference?.Theme) return;

        if (internal) {
            _colorRef.current = internal;
            _colorRef.key = "darker";

            AppearanceManager?.setShouldSyncAppearanceSettings?.(false);
            if (ThemeStore && typeof (ThemeStore as any).theme !== "undefined") {
                try { (ThemeStore as any).theme = _colorRef.key; } catch {}
            }
            AppearanceManager?.updateTheme?.(_colorRef.key);
        } else {
            const fallback = _colorRef.lastSetDiscordTheme ?? "darker";
            _colorRef.current = null;
            _colorRef.key = "darker";
            if (ThemeStore && typeof (ThemeStore as any).theme !== "undefined") {
                try { (ThemeStore as any).theme = fallback; } catch {}
            }
            AppearanceManager?.updateTheme?.(fallback);
        }
    } catch (error) {
        logger.error("[Themer] updateThemeColors failed", error);
    }
}

export function clearThemeColors() {
    updateThemeColors(null);
}

export function unpatchTheme() {
    for (const unpatch of patches) {
        try {
            unpatch();
        } catch (error) {
            logger.error("[Themer] Failed to unpatch", error);
        }
    }
    patches.length = 0;
}
