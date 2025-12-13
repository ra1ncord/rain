import { removeCacheFile } from "./fs";

// @ts-ignore
const pyonLoaderIdentity = globalThis.__PYON_LOADER__;

// @ts-ignore
const rainLoaderIdentity = globalThis.__RAIN_LOADER__;

// @ts-ignore
const vendettaLoaderIdentity = globalThis.__vendetta_loader;

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
        return rainLoaderIdentity();
    }

    return null;
}

export function getLoaderName() {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderName;
    else if (isRainLoader()) return rainLoaderIdentity.loadername;

    return "Unknown";
}

export function getLoaderVersion(): string | null {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderVersion;
    else if (isRainLoader()) return rainLoaderIdentity.loaderVersion;
    return null;
}

export function isLoaderConfigSupported() {
    if (isPyonLoader()) {
        return true;
    } else if (isRainLoader()) {
        return true;
    }

    return false;
}

export function getThemeFilePath() {
    if (isPyonLoader()) {
        return "pyoncord/current-theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isPyonLoader()) {
        return Boolean(window.__reactDevTools);
    }
    if (isRainLoader()) {
        return Boolean(window.__reactDevTools);
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        window.__pyoncord_rdt = window.__reactDevTools.exports;
        return "__pyoncord_rdt";
    }

    if (isRainLoader()) {
        window.__pyoncord_rdt = window.__reactDevTools.exports;
        return "__pyoncord_rdt";
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        return window.__reactDevTools.version || null;
    }

    if (isRainLoader()) {
        return window.__reactDevTools.version || null;
    }

    return null;
}

export function isSysColorsSupported() {
    return true;
}

export function getSysColors() {
    if (!isSysColorsSupported()) return null;
    if (isPyonLoader()) {
        return pyonLoaderIdentity.sysColors;
    }
    if (isRainLoader()) {
        return rainLoaderIdentity.sysColors;
    }

    return null;
}

export function getLoaderConfigPath() {
    if (isPyonLoader()) {
        return "pyoncord/loader.json";
    } else if (isRainLoader()) {
        return "rain/loader.json";
    }

    return "loader.json";
}