import { logger } from "@lib/utils/logger";
import { ThemesPlusMeta, ThemesPlusState } from "./types";
import { setIconpack, getActiveIconpackId } from "./iconpacks";

const runtime: ThemesPlusState = {
    activeIconpack: null,
    lastAppliedTheme: null,
    plus: null,
};

export function getThemesPlusState(): ThemesPlusState {
    return runtime;
}

export function applyPlus(manifest: any) {
    runtime.plus = null;
    runtime.activeIconpack = null;

    if (!manifest || typeof manifest !== "object") return manifest;
    const plus = (manifest as any).plus as ThemesPlusMeta | undefined;
    if (!plus || (plus.version !== undefined && plus.version !== 0)) {
        return manifest;
    }

    runtime.plus = plus;
    runtime.lastAppliedTheme = (manifest as any).name ?? null;

    try {
        if (plus.iconpack) {
            setIconpack(plus.iconpack)
                .then(() => {
                    runtime.activeIconpack = getActiveIconpackId();
                })
        } else {
            setIconpack(null)
                .then(() => { runtime.activeIconpack = null; })
                .catch(() => {});
        }
    } catch (e) {
        
    }

    return manifest;
}
