import { VendettaThemeManifest } from "@rain/plugins/_core/painter/themes/types";
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

export interface VdThemeInfo {
    id: string;
    selected: boolean;
    data: VendettaThemeManifest;
}

export function isVendettaLoader() {
    return vendettaLoaderIdentity != null;
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
    else if (isVendettaLoader()) return vendettaLoaderIdentity.name;

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
    } else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.loaderConfig;
    } else if (isRainLoader()) {
        return true;
    }

    return false;
}

export function isThemeSupported() {
    if (isPyonLoader()) {
        return pyonLoaderIdentity.hasThemeSupport;
    } else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.themes != null;
    } else if (isRainLoader()) {
        return false; // Rain has theme support disabled, this is here just to make sure it doesnt think it does
    }

    return false;
}

//export function getStoredTheme(): VdThemeInfo | null {
//    if (isPyonLoader()) {
//        return pyonLoaderIdentity.storedTheme;
//    } else if (isVendettaLoader()) {
//        const themeProp = vendettaLoaderIdentity!!.features.themes?.prop;
//        if (!themeProp) return null;
//        // @ts-ignore
//        return globalThis[themeProp] || null;
//    }
//
//    return null;
//}

export function getThemeFilePath() {
    if (isPyonLoader()) {
        return "pyoncord/current-theme.json";
    } else if (isVendettaLoader()) {
        return "vendetta_theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isPyonLoader()) {
        return Boolean(window.__REACT_DEVTOOLS__);
    }
    if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.devtools != null;
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        window.__pyoncord_rdt = window.__REACT_DEVTOOLS__.exports;
        return "__pyoncord_rdt";
    }

    if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.devtools!!.prop;
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        return window.__REACT_DEVTOOLS__.version || null;
    }
    if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.devtools!!.version;
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
    } else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.syscolors!!.prop;
    }

    return null;
}

export function getStoredTheme(): VdThemeInfo | null {
    if (isPyonLoader()) {
        return pyonLoaderIdentity.storedTheme;
    } else if (isVendettaLoader()) {
        const themeProp = vendettaLoaderIdentity!!.features.themes?.prop;
        if (!themeProp) return null;
        // @ts-ignore
        return globalThis[themeProp] || null;
    }

    return null;
}

export function getLoaderConfigPath() {
    return "loader.json";
}

export function isFontSupported() {
    if (isPyonLoader()) return pyonLoaderIdentity.fontPatch === 2;

    return false;
}

export async function clearBundle() {
    // TODO: This should be not be hardcoded, maybe put in loader.json?
    return void await removeCacheFile("bundle.js");
}