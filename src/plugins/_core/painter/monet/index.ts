import { findAssetId } from "@api/assets";
import { callBridgeMethod } from "@api/native/bridge";
import { getSysColors as getLoaderSysColors, isSysColorsSupported } from "@api/native/loader";
import { waitForHydration } from "@api/storage";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { LoggerClass } from "@lib/utils/logger";
import { findByStoreNameLazy } from "@metro/wrappers";

import { getCurrentTheme } from "../themes";
import { updateColor } from "../themes/updater";
import type { ThemeManifest } from "../themes/types";

import usePatches from "./hooks/usePatches";
import { useMonetSettings } from "./storage";
import { build, getDiscordTheme, type BuiltTheme } from "./stuff/buildTheme";
import type { VendettaSysColors } from "./types";

const logger = new LoggerClass("MonetTheme");
const ThemeStore = findByStoreNameLazy("ThemeStore");

const hasThemeKey = Symbol.for("monettheme.isThemed");

export const patchesURL = () =>
    `https://raw.githubusercontent.com/nexpid/VendettaMonetTheme/${
        useMonetSettings.getState().patches.commit ?? "main"
    }/patches.jsonc`;
export const devPatchesURL = "http://192.168.2.22:8730/patches.jsonc";

// --- System color resolution with multiple fallback sources ---
let cachedSysColors: VendettaSysColors | null = null;

function isValidSysColors(obj: any): obj is VendettaSysColors {
    return obj
        && Array.isArray(obj.accent1)
        && Array.isArray(obj.accent2)
        && Array.isArray(obj.accent3)
        && Array.isArray(obj.neutral1)
        && Array.isArray(obj.neutral2);
}

/** Synchronous: returns cached colors or tries loader + legacy global */
export function getMonetSysColors(): VendettaSysColors | null {
    if (cachedSysColors) return cachedSysColors;

    // Try Rain/Pyon loader identity
    const loaderColors = getLoaderSysColors();
    if (isValidSysColors(loaderColors)) {
        cachedSysColors = loaderColors;
        return cachedSysColors;
    }

    // Fallback: legacy Vendetta/Bunny global (some loaders still set this)
    const vendettaColors = (window as any).__vendetta_syscolors;
    if (isValidSysColors(vendettaColors)) {
        cachedSysColors = vendettaColors;
        return cachedSysColors;
    }

    return null;
}

/** Async: tries all sync sources, then falls back to native bridge call */
export async function refreshMonetSysColors(): Promise<VendettaSysColors | null> {
    const sync = getMonetSysColors();
    if (sync) return sync;

    // Last resort: try fetching via the native Rain bridge
    try {
        const bridgeColors = await callBridgeMethod("syscolors.get");
        if (isValidSysColors(bridgeColors)) {
            cachedSysColors = bridgeColors;
            return cachedSysColors;
        }
    } catch {
        // Bridge method not available on this loader version — that's fine
    }

    return null;
}

export function hasMonetTheme(): boolean {
    const currentTheme = getCurrentTheme();
    // Check in-memory flag OR persisted active state
    return !currentTheme && ((window as any)[hasThemeKey] || useMonetSettings.getState().active);
}

export function applyMonetTheme(theme: BuiltTheme | null): boolean {
    try {
        updateColor(theme as ThemeManifest | null, { update: true });
        const isActive = !!theme;
        (window as any)[hasThemeKey] = isActive;
        // Persist the active state so the theme survives restarts
        useMonetSettings.getState().updateSettings({ active: isActive });
        return true;
    } catch (e) {
        logger.error("Failed to apply theme", e);
        return false;
    }
}

export function setColorsFromDynamic(
    clr: VendettaSysColors,
    updateSettings: (s: Partial<any>) => void,
) {
    updateSettings({
        colors: {
            neutral1: clr.neutral1[7],
            neutral2: clr.neutral2[7],
            accent1: clr.accent1[7],
            accent2: clr.accent2[7],
            accent3: clr.accent3[7],
        },
    });
}

const cleanupFns: (() => void)[] = [];

export async function initMonet() {
    await waitForHydration(useMonetSettings);

    const settings = useMonetSettings.getState();

    // Resolve system colors (sync sources + async bridge fallback)
    const syscolors = await refreshMonetSysColors();
    logger.log("System colors resolved:", syscolors ? "found" : "unavailable");

    // Auto-fill colors from system if first run and available
    if (!settings.colors.accent1 && syscolors) {
        setColorsFromDynamic(syscolors, useMonetSettings.getState().updateSettings);
    }

    let lTheme = getDiscordTheme();

    // Update cache for change detection
    useMonetSettings.getState().updateSettings({
        cache: {
            colors: JSON.stringify(syscolors),
            theme: lTheme,
        },
    });

    const rebuildAndApply = async () => {
        if (!useMonetSettings.getState().active) return;

        const cpatches = await usePatches.patches;
        if (!cpatches) {
            logger.error("Failed to fetch color patches for reapply");
            return;
        }

        let theme: BuiltTheme;
        try {
            theme = build(cpatches);
        } catch {
            logger.error("Failed to build theme for reapply");
            return;
        }

        updateColor(theme as ThemeManifest | null, { update: true });
        (window as any)[hasThemeKey] = true;
    };

    // If monet was active before restart, rebuild and apply now
    if (settings.active) {
        logger.log("Restoring Monet theme from previous session");
        await rebuildAndApply();
    }

    // Listen for Discord theme changes (light/dark) to auto-reapply
    const onThemeChanged = () => {
        const newLTheme = getDiscordTheme();
        if (lTheme !== newLTheme) {
            lTheme = newLTheme;
            rebuildAndApply();
        }
    };

    try {
        ThemeStore?.addChangeListener?.(onThemeChanged);
        cleanupFns.push(() => ThemeStore?.removeChangeListener?.(onThemeChanged));
    } catch (e) {
        logger.error("Failed to add theme change listener", e);
    }
}

export function destroyMonet() {
    for (const cleanup of cleanupFns) {
        try { cleanup(); } catch {}
    }
    cleanupFns.length = 0;

    if (hasMonetTheme()) {
        showConfirmationAlert({
            title: "Deselect Theme",
            content: "Monet theme is currently active, would you like to deselect it?",
            onConfirm: () => {
                applyMonetTheme(null);
            },
            confirmText: "Unload",
            cancelText: "Cancel",
        });
    }
}
