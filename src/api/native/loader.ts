import { ThemeManifest } from "@rain/plugins/_core/painter/themes/types";

// @ts-ignore
const pyonLoaderIdentity = globalThis.__PYON_LOADER__;

// @ts-ignore
const rainLoaderIdentity = globalThis.__RAIN_LOADER__;

export interface ThemeInfo {
    id: string;
    selected: boolean;
    data: ThemeManifest;
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
    }
    if (isRainLoader()) {
        return rainLoaderIdentity;
    }

    return null;
}

export function getLoaderName() {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderName;
    if (isRainLoader()) return rainLoaderIdentity.loaderName;

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

export function getThemeFilePath() {
    if (isRainLoader()) {
        return "rain/current-theme.json";
    }
    if (isPyonLoader()) {
        return "pyon/current-theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    return Boolean(window.__REACT_DEVTOOLS__);
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

export function getStoredTheme(): ThemeInfo | null {
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
