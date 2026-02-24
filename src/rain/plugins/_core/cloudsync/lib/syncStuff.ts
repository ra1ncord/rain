import { readFile, writeFile } from "@api/native/fs";
import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { pluginInstances, startPlugin, stopPlugin, isPluginEnabled } from "@plugins";
import { useThemes, installTheme, selectTheme } from "@plugins/_core/painter/themes";
import { useFonts, saveFont, selectFont } from "@plugins/_core/painter/fonts";
import type { UserData } from "../types";

// Helper functions to map IDs <-> URLs
const pluginUrl = (id: string) => `https://raincord.dev/plugins/${encodeURIComponent(id)}`;
const themeUrl = (id: string) => `https://raincord.dev/themes/${encodeURIComponent(id)}`;
const fontUrl = (id: string) => `https://raincord.dev/fonts/${encodeURIComponent(id)}`;
const fromPluginUrl = (url: string) => decodeURIComponent(url.replace(/^https:\/\/raincord\.dev\/plugins\//, ""));
const fromThemeUrl = (url: string) => decodeURIComponent(url.replace(/^https:\/\/raincord\.dev\/themes\//, ""));
const fromFontUrl = (url: string) => decodeURIComponent(url.replace(/^https:\/\/raincord\.dev\/fonts\//, ""));
import { cloudSyncSettings } from "../storage";

function stripNoCloudSync(obj: unknown) {
    if (obj && typeof obj === "object") {
        if (Array.isArray(obj)) {
            const filtered: any[] = [];
            for (const val of obj) {
                const rep = stripNoCloudSync(val);
                if (rep !== undefined) filtered.push(rep);
            }
            return filtered;
        } else {
            const objAny = obj as any;
            if (objAny.__no_cloud_sync || objAny.__no_sync) return undefined;
            const filtered: Record<string, any> = {};
            for (const [key, value] of Object.entries(objAny)) {
                if (key.startsWith("__")) continue;
                const rep = stripNoCloudSync(value);
                if (rep !== undefined) filtered[key] = rep;
            }
            return filtered;
        }
    } else return obj;
}

export async function grabEverything(): Promise<UserData & { coreSettings?: any }> {
    const sync = {
        plugins: {},
        themes: {},
        fonts: {
            installed: {},
            custom: [],
        },
    } as UserData 

    for (const [id, item] of pluginInstances.entries()) {
        if (cloudSyncSettings.ignoredPlugins.includes(id)) continue;
        try {
            const storagePath = `plugins/${id}.json`;
            const storage = await readFile(storagePath).catch(() => null);
            const pluginData: { enabled: boolean; storage?: string } = {
                enabled: isPluginEnabled(id),
            };
            if (storage) {
                pluginData.storage = JSON.stringify(stripNoCloudSync(JSON.parse(storage)));
            }
            sync.plugins[pluginUrl(id)] = pluginData;
        } catch (e) {
            logger.error(`[CloudSync] Failed to grab storage for ${id}:`, e);
        }
    }

    const themeStore = useThemes.getState();
    for (const [id, item] of Object.entries(themeStore.themes)) {
        sync.themes[themeUrl(id)] = {
            enabled: item.selected,
        };
    }

    const fontStore = useFonts.getState();
    const selFont = fontStore.fonts.__selected;
    for (const [name, item] of Object.entries(fontStore.fonts)) {
        if (name === "__selected") continue;
        // Only operate on FontDefinition objects
        if (typeof item === "object" && item && "main" in item) {
            const fontDef = item as any;
            if (fontDef.source) {
                sync.fonts.installed[fontUrl(fontDef.source)] = {
                    enabled: selFont === name,
                };
            } else {
                sync.fonts.custom.push({
                    ...fontDef,
                    enabled: selFont === name,
                });
            }
        }
    }

    return sync;
}

export async function importData(data: UserData & { coreSettings?: any }) {
    showToast("Importing data...", findAssetId("DownloadIcon"));
        // Core/global settings are no longer imported

    const status = { plugins: 0, themes: 0, fonts: 0 };

    // Plugins
    for (const [url, item] of Object.entries(data.plugins)) {
        const id = fromPluginUrl(url);
        logger.log(`[CloudSync][Import] Plugin: ${id}, enabled: ${item.enabled}`);
        try {
            if (item.storage) {
                logger.log(`[CloudSync][Import] Writing settings for plugin ${id}`);
                await writeFile(`plugins/${id}.json`, item.storage);
            }
            const currentlyEnabled = isPluginEnabled(id);
            if (item.enabled && !currentlyEnabled) {
                logger.log(`[CloudSync][Import] Enabling plugin ${id}`);
                await startPlugin(id);
            } else if (!item.enabled && currentlyEnabled) {
                logger.log(`[CloudSync][Import] Disabling plugin ${id}`);
                await stopPlugin(id);
            }
            status.plugins++;
        } catch (e) {
            logger.error(`[CloudSync] Failed to import plugin ${id}:`, e);
        }
    }

    // Themes
    for (const [url, item] of Object.entries(data.themes)) {
        const id = fromThemeUrl(url);
        logger.log(`[CloudSync][Import] Theme: ${id}, enabled: ${item.enabled}`);
        try {
            const themeStore = useThemes.getState();
            if (!themeStore.themes[id]) {
                logger.log(`[CloudSync][Import] Installing theme ${id}`);
                await installTheme(id);
            }
            if (item.enabled) {
                logger.log(`[CloudSync][Import] Selecting theme ${id}`);
                await selectTheme(themeStore.themes[id]);
            }
            status.themes++;
        } catch (e) {
            logger.error(`[CloudSync] Failed to import theme ${id}:`, e);
        }
    }

    // Fonts
    for (const [url, item] of Object.entries(data.fonts.installed)) {
        const source = fromFontUrl(url);
        logger.log(`[CloudSync][Import] Font: ${source}, enabled: ${item.enabled}`);
        try {
            await saveFont(source, item.enabled);
            status.fonts++;
        } catch (e) {
            logger.error(`[CloudSync] Failed to import font ${source}:`, e);
        }
    }

    for (const item of data.fonts.custom) {
        logger.log(`[CloudSync][Import] Custom font: ${item.name}, enabled: ${item.enabled}`);
        try {
            await saveFont(item, item.enabled);
            status.fonts++;
        } catch (e) {
            logger.error(`[CloudSync] Failed to import custom font ${item.name}:`, e);
        }
    }

    showToast(
        `Imported ${status.plugins} plugins, ${status.themes} themes, and ${status.fonts} fonts.`,
        findAssetId("CheckIcon"),
    );
}
