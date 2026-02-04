import { VendettaThemeManifest } from "@rain/plugins/_core/painter/themes/types";

import { removeCacheFile } from "./fs";

// @ts-ignore
const pyonLoaderIdentity = globalThis.__PYON_LOADER__;

// @ts-ignore
const rainLoaderIdentity = globalThis.__RAIN_LOADER__;

export interface VendettaLoaderIdentity {
    name: string;
    features: {
        loaderConfig?: boolean;
        devtools?: {
            prop: string;
            version: string;
        },
        themes?: {
            prop: string;
        };
    };
}

export interface VdThemeInfo {
    id: string;
    selected: boolean;
    data: VendettaThemeManifest;
}

export function isPyonLoader() {
    return pyonLoaderIdentity != null;
}

export function isRainLoader() {
    return rainLoaderIdentity != null;
}

export function getLoaderIdentity() {
    if (isPyonLoader()) {
        return pyonLoaderIdentity;
    } else if (isRainLoader()) {
        return rainLoaderIdentity;
    }

    return null;
}

export function getLoaderName() {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderName;
    if (isRainLoader()) return rainLoaderIdentity.loadername;

    return "Unknown";
}

export function getLoaderVersion(): string | null {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderVersion;
    if (isRainLoader()) return rainLoaderIdentity.loaderVersion;
    return null;
}

export function isLoaderConfigSupported() {
    if (isRainLoader()) {
        return true;
    }
    if (isPyonLoader()) {
        return true;
    }

    return false;
}

export function isThemeSupported() {
    if (isRainLoader()) {
        return rainLoaderIdentity.hasThemeSupport;
    }
    if (isPyonLoader()) {
        return pyonLoaderIdentity.hasThemeSupport;
    }

    return false;
}

export function getThemeFilePath() {
    if (isRainLoader()) {
        return "raincord/current-theme.json";
    }
    if (isPyonLoader()) {
        return "pyon/current-theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isPyonLoader()) {
        return Boolean(window.__REACT_DEVTOOLS__);
    }
    if (isRainLoader()) {
        return Boolean(window.__REACT_DEVTOOLS__);
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isRainLoader()) {
        window.__rain_rdt = window.__REACT_DEVTOOLS__.exports;
        return "__rain_rdt";
    }

    if (isPyonLoader()) {
        window.__pyoncord_rdt = window.__REACT_DEVTOOLS__.exports;
        return "__pyoncord_rdt";
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isRainLoader()) {
        return window.__REACT_DEVTOOLS__.version || null;
    }
    if (isPyonLoader()) {
        return window.__REACT_DEVTOOLS__.version || null;
    }

    return null;
}

export function getSysColors() {
    if (isRainLoader()) {
        return rainLoaderIdentity.sysColors;
    }
    if (isPyonLoader()) {
        return pyonLoaderIdentity.sysColors;
    }
}

export function getStoredTheme(): VdThemeInfo | null {
    if (isRainLoader()) {
        return rainLoaderIdentity.storedTheme;
    }
    if (isPyonLoader()) {
        return pyonLoaderIdentity.storedTheme;
    }

    return null;
}

export function getLoaderConfigPath() {
    return "loader.json";
}

export async function clearBundle() {
    // TODO: This should be not be hardcoded, maybe put in loader.json?
    return void await removeCacheFile("bundle.js");
}
