import { after } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

let origType: Function | null = null;
let memoWrapper: any = null;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let unpatchAddFavorite: (() => void) | null = null;
let unpatchMobileFavorites: (() => void) | null = null;
let origUseFavoriteGIFsMobile: Function | null = null;
let favMobileModule: any = null;

const VIDEO_EXT = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".m4v", ".gifv"];
const processed = new WeakSet<object>();

function isVideo(url: string | undefined | null): boolean {
    if (!url) return false;
    try {
        const path = url.split("?")[0].toLowerCase();
        return VIDEO_EXT.some(e => path.endsWith(e));
    } catch {
        return false;
    }
}

function makeVideoThumbnail(url: string): string {
    if (!url) return url;
    try {
        const out = url.replace("cdn.discordapp.com", "media.discordapp.net");
        if (out.includes("media.discordapp.net") || out.includes("images-ext")) {
            return out + (out.includes("?") ? "&" : "?") + "format=jpeg";
        }
    } catch {}
    return url;
}

function findGIFFavButton(): any {
    const modules = (window as any).rain?.metro?.modules ?? (window as any).modules;
    if (!modules) return null;

    for (const id in modules) {
        try {
            const mod = modules[id]?.publicModule?.exports;
            if (!mod) continue;

            const def = mod.default;

            if (def?.$$typeof?.toString().includes("memo") && def.type) {
                if (def.type.displayName === "GIFFavButton" || def.type.name === "GIFFavButton") {
                    return def;
                }
            }

            if (typeof mod === "function" && (mod.displayName === "GIFFavButton" || mod.name === "GIFFavButton")) {
                return mod;
            }
        } catch {}
    }
    return null;
}

function patchSource(source: any): any {
    if (!source || source.isGIFV) return source;
    return {
        ...source,
        isGIFV: true,
        embedURI: source.embedURI || source.sourceURI || source.uri,
        videoURI: source.videoURI || source.uri,
        embedProviderName: source.embedProviderName || "",
    };
}

function applyPatch(): boolean {
    try {
        memoWrapper = findGIFFavButton();
        if (!memoWrapper) return false;

        const original = memoWrapper.type ?? memoWrapper;
        if (typeof original !== "function") return false;
        origType = original;

        memoWrapper.type = function PatchedGIFFavButton(this: any, props: any) {
            try {
                if (props?.source && !props.source.isGIFV) {
                    return original.call(this, { ...props, source: patchSource(props.source) });
                }
                return original.call(this, props);
            } catch (e) {
                logger.error("[FavouriteAnything] render error:", e);
                return original.call(this, props);
            }
        };
        (memoWrapper.type as any).displayName = "GIFFavButton";

        return true;
    } catch (e) {
        logger.error("[FavouriteAnything] applyPatch error:", e);
        return false;
    }
}

function patchAddFavorite() {
    try {
        const favModule = findByProps("addFavoriteGIF");
        if (!favModule) return;

        unpatchAddFavorite = after("addFavoriteGIF", favModule, args => {
            try {
                const data = args[0];
                if (!data || typeof data !== "object") return;

                const url = data.url ?? "";
                const src = data.src ?? "";

                if (isVideo(url) || isVideo(src)) {
                    data.format = 2;
                } else if (data.format === 2) {
                    data.format = 1;
                }
            } catch (e) {
                logger.error("[FavouriteAnything] addFavoriteGIF hook error:", e);
            }
        });
    } catch (e) {
        logger.error("[FavouriteAnything] patchAddFavorite error:", e);
    }
}

function patchMobileFavorites() {
    try {
        const mod = findByProps("useFavoriteGIFsMobile");
        if (!mod) return;

        const origFn = mod.useFavoriteGIFsMobile;
        if (!origFn) return;

        favMobileModule = mod;
        origUseFavoriteGIFsMobile = origFn;

        let lastFavs: any = null;

        mod.useFavoriteGIFsMobile = function (...args: any[]) {
            try {
                const result = origFn.apply(this, args);
                if (!result?.favorites || !Array.isArray(result.favorites)) return result;

                if (result.favorites !== lastFavs) {
                    lastFavs = result.favorites;
                    for (const item of result.favorites) {
                        if (!item || processed.has(item)) continue;
                        processed.add(item);

                        const url = item.src || item.url;
                        if (isVideo(url)) {
                            item.src = makeVideoThumbnail(url);
                        }
                    }
                }

                return result;
            } catch (e) {
                logger.error("[FavouriteAnything] useFavoriteGIFsMobile hook error:", e);
                return origFn?.apply(this, args);
            }
        };

        unpatchMobileFavorites = () => {
            try {
                if (favMobileModule) favMobileModule.useFavoriteGIFsMobile = origUseFavoriteGIFsMobile;
            } catch {}
            favMobileModule = null;
            origUseFavoriteGIFsMobile = null;
        };
    } catch (e) {
        logger.error("[FavouriteAnything] patchMobileFavorites error:", e);
    }
}

export default definePlugin({
    name: "FavouriteAnything",
    description: "Allows favouriting any media, not just GIFs",
    author: [Developers.kmmiio99o],
    id: "favouriteanything",
    version: "1.0.0",
    start() {
        if (applyPatch()) {
        } else {
            let retries = 0;
            const tryPatch = () => {
                if (applyPatch()) {
                    retryTimeout = null;
                } else if (retries++ < 50) {
                    retryTimeout = setTimeout(tryPatch, 300);
                } else {
                    logger.error("[FavouriteAnything] GIFFavButton not found after retries.");
                }
            };
            retryTimeout = setTimeout(tryPatch, 300);
        }

        patchAddFavorite();
        patchMobileFavorites();
    },
    stop() {
        try {
            if (retryTimeout) {
                clearTimeout(retryTimeout);
                retryTimeout = null;
            }

            if (memoWrapper && origType) {
                const current = memoWrapper.type;
                if ((current as any)?.__original === origType) {
                    memoWrapper.type = origType;
                }
                origType = null;
                memoWrapper = null;
            }

            if (unpatchAddFavorite) {
                unpatchAddFavorite();
                unpatchAddFavorite = null;
            }

            if (unpatchMobileFavorites) {
                unpatchMobileFavorites();
                unpatchMobileFavorites = null;
            }
        } catch (e) {
            logger.error("[FavouriteAnything] stop error:", e);
        }
    },
});
