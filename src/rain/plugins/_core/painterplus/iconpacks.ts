import { awaitStorage, createStorage } from "@api/storage";
import { assetsModule } from "@api/assets/patches";
import safeFetch from "@lib/utils/safeFetch";
import { logger } from "@lib/utils/logger";

interface IconPackIndex {
    list: IconPackItem[];
}

interface IconPackItem {
    id: string;
    name: string;
    description?: string;
    suffix?: string;
    config: string;
    load: string;
}

interface IconpackCache {
    index?: IconPackIndex;
    lastFetched?: number;
    themelings?: Record<string, string>;
    activeIconpackId?: string | null;
}

let isInitialized = false;
const ICONPACK_INDEX = "https://raw.githubusercontent.com/nexpid/ThemesPlus/main/iconpacks/list.json";
const THEMELINGS_ICONS = "https://raw.githubusercontent.com/nexpid/Themelings/data/icons.json";
const cache = createStorage<IconpackCache>("painterplus/iconpacks.json", { dflt: { themelings: {} } });

let activePack: IconPackItem | null = null;
const aliasMap: Record<string, string> = {
    PaintPaletteIcon: "palette",
    WrenchIcon: "wrench",
    MoreHorizontalIcon: "more_horiz",
    ClipboardListIcon: "clipboard_list",
    DownloadIcon: "download",
};
let assetUnpatch: (() => void) | null = null;
let assetOverridePatched = false;

export async function initIconpacks() {
    try {
        await awaitStorage(cache);
        if (!cache.themelings) {
            await fetchThemelingsMap();
        }
        isInitialized = true;
        
        if (cache.activeIconpackId) {
            logger.info(`[Themes+] Restoring iconpack '${cache.activeIconpackId}' from storage`);
            await setIconpack(cache.activeIconpackId);
        }
    } catch (e) {
        logger.error("[Themes+] Failed to init iconpack cache", e);
        isInitialized = true;
    }
}

export function isThemesPlusInitialized(): boolean {
    return isInitialized;
}

export function getThemesPlusDiagnostics() {
    const themelingsCount = cache?.themelings ? Object.keys(cache.themelings).length : 0;
    return {
        initialized: isInitialized,
        activeIconpackId: activePack?.id ?? null,
        assetOverridePatched,
        themelingsCount,
        indexLoaded: !!cache.index,
    };
}

async function fetchIndex(): Promise<IconPackIndex | null> {
    try {
        const res = await safeFetch(ICONPACK_INDEX, { cache: "no-store" });
        const json = await res.json();
        cache.index = json;
        cache.lastFetched = Date.now();
        return json as IconPackIndex;
    } catch (e) {
        logger.warn("[Themes+] Failed to fetch iconpack index", e);
        return cache.index ?? null;
    }
}

async function getIndex(): Promise<IconPackIndex | null> {
    if (cache.index) return cache.index;
    return fetchIndex();
}

async function fetchThemelingsMap() {
    try {
        const res = await safeFetch(THEMELINGS_ICONS, { cache: "no-store" });
        const json = await res.json();
        cache.themelings = json as Record<string, string>;
        return cache.themelings;
    } catch (e) {
        logger.warn("[Themes+] Failed to fetch Themelings icons", e);
        return cache.themelings ?? {};
    }
}

export async function setIconpack(id?: string | null) {
    if (!id) {
        activePack = null;
        cache.activeIconpackId = null;
        logger.info("[Themes+] Iconpack cleared");
        return;
    }

    if (!isInitialized) {
        logger.info(`[Themes+] Deferring iconpack '${id}' until initialized`);
        setTimeout(() => setIconpack(id).catch(() => {}), 100);
        return;
    }

    const index = await getIndex();
    if (!index?.list?.length) {
        logger.warn("[Themes+] No iconpack index available");
        activePack = null;
        cache.activeIconpackId = null;
        return;
    }

    logger.info(`[Themes+] Looking for iconpack '${id}' in ${index.list.length} packs`);
    const pack = index.list.find(p => p.id === id);
    if (!pack) {
        logger.warn(`[Themes+] Iconpack '${id}' not found. Available: ${index.list.map(p => p.id).join(", ")}`);
        activePack = null;
        cache.activeIconpackId = null;
        return;
    }
    activePack = pack;
    cache.activeIconpackId = id;
    logger.info(`[Themes+] Iconpack applied: ${pack.id} (load: ${pack.load})`);
}

export function getActiveIconpackId() {
    return activePack?.id ?? null;
}

function resolvePackUri(name?: string, type?: string) {
    if (!activePack || !name) return undefined;
    
    const ext = type ? `.${type}` : ".png";
    const suffix = activePack.suffix ?? "";
    const themelings = (cache as any)?.themelings ?? {};
    const mapped = (typeof themelings === "object" && themelings[name]) || aliasMap[name] || name;
    if (typeof mapped !== "string") return undefined;
    
    const load = typeof activePack.load === "string" ? activePack.load : "";
    if (!load) return undefined;
    
    const baseUrl = load.endsWith('/') ? load.slice(0, -1) : load;
    const uri = `${baseUrl}/${mapped}${suffix}${ext}`;
    return uri;
}

export function patchAssetOverrides() {
    if (!assetsModule || !assetsModule.getAssetByID) {
        logger.warn("[Themes+] assetsModule not ready; iconpacks disabled");
        logger.warn(`[Themes+] assetsModule exists: ${!!assetsModule}, getAssetByID exists: ${!!(assetsModule as any)?.getAssetByID}`);
        return;
    }
    if (assetUnpatch) {
        logger.info("[Themes+] Asset override already patched");
        return;
    }

    const original = assetsModule.getAssetByID.bind(assetsModule);
    logger.info("[Themes+] Patching getAssetByID for iconpacks");
    let patchCallCount = 0;
    let overrideCount = 0;
    
    assetsModule.getAssetByID = function patchedGetAssetByID(id: number) {
        patchCallCount++;
        const asset = original(id);
        
        if (patchCallCount <= 3) {
            logger.info(`[Themes+] getAssetByID called (${patchCallCount}): id=${id}, asset=${asset?.name}, activePack=${activePack?.id}`);
        }
        
        if (!asset || !activePack) return asset;
        
        try {
            const assetName = asset?.name;
            if (typeof assetName !== "string") return asset;

            const uri = resolvePackUri(assetName, asset?.type);
            if (!uri) return asset;
            
            overrideCount++;
            if (overrideCount <= 5) {
                logger.info(`[Themes+] Override ${overrideCount}: '${assetName}' → ${uri}`);
            }

            return {
                ...asset,
                uri,
            };
        } catch (e) {
            logger.warn(`[Themes+] Error overriding asset ${id}:`, e);
            return asset;
        }
    };

    assetUnpatch = () => {
        try {
            assetsModule.getAssetByID = original;
            logger.info(`[Themes+] Asset override unpatched (total calls: ${patchCallCount}, overrides: ${overrideCount})`);
            assetUnpatch = null;
            assetOverridePatched = false;
        } catch {}
    };

    assetOverridePatched = true;
}

export function unpatchAssetOverrides() {
    if (assetUnpatch) assetUnpatch();
}
