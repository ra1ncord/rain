import { after, instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { findByFilePathLazy } from "@metro/wrappers";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

const GIFFavButton = findByFilePathLazy("modules/media_viewer/native/components/overlay/MediaViewerOverlayButtonFavoriteGIF.tsx", true);

let unpatchGIFFavButton: (() => void) | null = null;
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
    author: [Developers.kmmiio99o, Contributors.theunrealzaka],
    id: "favouriteanything",
    version: "1.0.0",
    start() {
        try {
            unpatchGIFFavButton = instead("type", GIFFavButton, (props: any, original: any) => {
                try {
                    if (props?.source && !props.source.isGIFV) {
                        return original({ ...props, source: patchSource(props.source) });
                    }
                } catch (e) {
                    logger.error("[FavouriteAnything] render error:", e);
                }
                return original(props);
            });
        } catch (e) {
            logger.error("[FavouriteAnything] applyPatch error:", e);
        }

        patchAddFavorite();
        patchMobileFavorites();
    },
    stop() {
        try {
            unpatchGIFFavButton?.();
            unpatchGIFFavButton = null;

            unpatchAddFavorite?.();
            unpatchAddFavorite = null;

            unpatchMobileFavorites?.();
            unpatchMobileFavorites = null;
        } catch (e) {
            logger.error("[FavouriteAnything] stop error:", e);
        }
    },
});