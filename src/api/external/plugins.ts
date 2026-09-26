import { createFileStorage, waitForHydration } from "@api/storage";
import { showToast } from "@api/ui/toasts";
import { safeFetch } from "@lib/utils";
import { logger, LoggerClass } from "@lib/utils/logger";
import { FluxDispatcher } from "@metro/common";
import { isPluginEnabled, pluginInstances, startPlugin, stopPlugin } from "@plugins";
import { rainPlugin } from "@plugins/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createMMKVBackend, createStorage, purgeStorage } from "./storage";
import { getVendettaObject } from "./vendetta";

export const EXTERNAL_PREFIX = "ext:";
export const EXTERNAL_MARKER = Symbol.for("rain.plugin.external");

export interface ExternalAuthor { name: string; id?: string; }

export interface ExternalManifest {
    name: string;
    description?: string;
    authors?: ExternalAuthor[];
    version?: string;
    main?: string;
    hash?: string;
    [key: string]: any;
}

export interface ExternalPlugin {
    id: string;
    source: string | null;
    manifest: ExternalManifest;
    js: string;
    update: boolean;
    installedAt: number;
    updatedAt: number;
}

interface ExternalPluginsStore {
    plugins: Record<string, ExternalPlugin>;
    autoUpdate: boolean;
    _hasHydrated: boolean;
    setPlugin: (p: ExternalPlugin) => void;
    deletePlugin: (id: string) => void;
    setAutoUpdate: (v: boolean) => void;
    setHasHydrated: (v: boolean) => void;
}

export const useExternalPlugins = create<ExternalPluginsStore>()(
    persist(
        set => ({
            plugins: {},
            autoUpdate: true,
            _hasHydrated: false,
            setPlugin: p => set(s => ({ plugins: { ...s.plugins, [p.id]: p } })),
            deletePlugin: id => set(s => {
                const plugins = { ...s.plugins };
                delete plugins[id];
                return { plugins };
            }),
            setAutoUpdate: v => set({ autoUpdate: v }),
            setHasHydrated: v => set({ _hasHydrated: v }),
        }),
        {
            name: "rain-external-plugins",
            storage: createJSONStorage(() => createFileStorage("external/plugins.json")),
            partialize: s => ({ plugins: s.plugins, autoUpdate: s.autoUpdate }) as any,
            onRehydrateStorage: () => state => state?.setHasHydrated(true),
        },
    ),
);

const getPlugin = (id: string) => useExternalPlugins.getState().plugins[id];
export const isExternalPluginId = (id: string) => id.startsWith(EXTERNAL_PREFIX);

function parseMetaHeader(js: string): Partial<ExternalManifest> | null {
    const header = js.match(/^\s*\/\*\*?([\s\S]*?)\*\//)?.[1];
    if (!header) return null;

    const meta: Record<string, string> = {};
    for (const m of header.matchAll(/@(\w+)[ \t]+([^\n\r]+)/g)) meta[m[1].toLowerCase()] = m[2].replace(/\s*\*?\s*$/, "").trim();
    if (!meta.name) return null;

    return {
        name: meta.name,
        description: meta.description,
        version: meta.version,
        authors: meta.author ? meta.author.split(/\s*,\s*/).map(name => ({ name, id: meta.authorid })) : undefined,
    };
}

const fileNameOf = (s: string) => decodeURIComponent(s.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? "plugin");
const slugify = (s: string) => s.toLowerCase().replace(/\.js$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plugin";

function looksLikeTheme(obj: any) {
    return obj && typeof obj === "object" && (obj.semanticColors || obj.rawColors || obj.theme_color_map || (obj.spec === 3 && obj.main));
}

function normalizeSource(url: string) {
    url = url.trim();
    if (/\.(js|json)([?#].*)?$/i.test(url)) return url;
    return url.endsWith("/") ? url : `${url}/`;
}

async function fetchFromSource(source: string, existing?: ExternalPlugin): Promise<{ manifest: ExternalManifest; js: string; }> {
    const fetchText = async (u: string) => (await safeFetch(u, { cache: "no-store" })).text();

    if (/\.js([?#].*)?$/i.test(source)) {
        const js = await fetchText(source);
        const meta = parseMetaHeader(js);
        return { js, manifest: { name: fileNameOf(source).replace(/\.js$/i, ""), ...meta } as ExternalManifest };
    }

    const manifestUrl = /\.json([?#].*)?$/i.test(source) ? source : `${source}manifest.json`;
    const base = manifestUrl.replace(/[^/]*$/, "");

    let manifest: ExternalManifest;
    try {
        manifest = JSON.parse(await fetchText(manifestUrl));
    } catch (e) {
        throw new Error(`Couldn't load manifest.json (${e instanceof Error ? e.message : e})`);
    }
    if (looksLikeTheme(manifest)) throw new Error("That's a theme");
    if (!manifest?.name) throw new Error("Not a plugin");

    if (existing?.js && manifest.hash && existing.manifest.hash === manifest.hash) {
        return { manifest, js: existing.js };
    }

    try {
        return { manifest, js: await fetchText(base + (manifest.main || "index.js")) };
    } catch (e) {
        throw new Error(`Download failed (${e instanceof Error ? e.message : e})`);
    }
}

interface EvaledPlugin {
    onLoad?: () => unknown;
    onUnload?: () => unknown;
    settings?: React.ComponentType<any>;
}

function compile(js: string, id: string): (...args: any[]) => any {
    const sourceUrl = id.replace(/[^\w:/.-]/g, "_");
    const params = "vendetta, rain, plugin, module, exports";
    const evalSrc = (src: string) => typeof globalThis.globalEvalWithSourceUrl === "function"
        ? globalThis.globalEvalWithSourceUrl(src, sourceUrl)
        : (0, eval)(`${src}\n//# sourceURL=${sourceUrl}`);

    const tryCompile = (src: string) => {
        try {
            return evalSrc(src);
        } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
            return undefined;
        }
    };

    const expr = js.replace(/(\n[ \t]*\/\/[^\n]*)+\s*$/, "").replace(/[\s;]+$/, "");
    const asExpression = tryCompile(`(function(${params}){return (${expr}\n)})`);
    if (asExpression) return asExpression;

    if (!/^\s*\/[/*]/.test(js)) {
        const asVendetta = tryCompile(`(function(${params}){return ${js}\n})`);
        if (asVendetta) return asVendetta;
    }

    return evalSrc(`(function(${params}){${js}\n;return module.exports;})`);
}

async function evaluate(p: ExternalPlugin): Promise<EvaledPlugin> {
    const pluginCtx = {
        id: p.id,
        manifest: p.manifest,
        storage: await createStorage<Record<string, any>>(createMMKVBackend(p.id)),
    };
    const vendetta = {
        ...getVendettaObject(),
        plugin: pluginCtx,
        logger: new LoggerClass(`Rain » ${p.manifest.name}`),
    };
    const module = { exports: {} as any };

    let ret = compile(p.js, p.id)(vendetta, window.rain, pluginCtx, module, module.exports);
    if (typeof ret === "function") ret = ret();
    ret = ret?.default ?? ret ?? module.exports?.default ?? module.exports;

    return {
        onLoad: ret?.onLoad ?? ret?.start,
        onUnload: ret?.onUnload ?? ret?.stop,
        settings: ret?.settings,
    };
}

function toAuthors(authors?: ExternalAuthor[]) {
    return (authors ?? []).map(a => {
        let id = 0n;
        try { if (a.id && /^\d+$/.test(String(a.id))) id = BigInt(a.id); } catch { }
        return { name: String(a.name ?? "Unknown"), id };
    });
}

function applyMeta(instance: rainPlugin, p: ExternalPlugin) {
    instance.name = p.manifest.name;
    instance.description = p.manifest.description ?? "";
    instance.version = p.manifest.version ?? "external";
    instance.author = toAuthors(p.manifest.authors);
}

function register(p: ExternalPlugin) {
    const existing = pluginInstances.get(p.id);
    if (existing) {
        applyMeta(existing, p);
        return existing;
    }

    let running: EvaledPlugin | null = null;

    const instance = {
        id: p.id,
        name: "",
        description: "",
        version: "",
        author: [],
        [EXTERNAL_MARKER]: true,
        async start() {
            const current = getPlugin(p.id);
            if (!current) throw new Error("Not installed");
            try {
                running = await evaluate(current);
                await running.onLoad?.();
            } catch (e) {
                logger.error(`[External] ${current.manifest.name} failed to start`, e);
                try { running?.onUnload?.(); } catch { }
                running = null;
                throw e;
            }
        },
        stop() {
            try {
                running?.onUnload?.();
            } finally {
                running = null;
            }
        },
    } as unknown as rainPlugin;

    Object.defineProperty(instance, "settings", {
        get: () => running?.settings,
        enumerable: true,
        configurable: true,
    });

    applyMeta(instance, p);
    pluginInstances.set(p.id, instance);
    return instance;
}

const refreshUI = () => FluxDispatcher.dispatch({ type: "RAIN_SETTING_UPDATED" });

async function restartIfRunning(id: string) {
    if (!isPluginEnabled(id)) return;
    try { await stopPlugin(id); } catch { }
    await startPlugin(id);
}

export async function registerExternalPlugins() {
    await waitForHydration(useExternalPlugins);
    const { plugins, autoUpdate } = useExternalPlugins.getState();

    for (const p of Object.values(plugins)) {
        try {
            register(p);
        } catch (e) {
            logger.error(`[External] failed to register ${p.id}`, e);
        }
    }

    if (autoUpdate) {
        setTimeout(() => void updateAllExternalPlugins({ restart: false, silent: true }), 5000);
    }

    const v = getVendettaObject();
    v.plugins = {
        plugins: new Proxy({}, {
            get: (_, id: string) => {
                const p = getPlugin(id) ?? getPlugin(EXTERNAL_PREFIX + normalizeSource(id));
                return p && { ...p, enabled: isPluginEnabled(p.id) };
            },
            ownKeys: () => Object.keys(useExternalPlugins.getState().plugins),
            getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
        }),
        installPlugin: (url: string) => installPluginFromUrl(url),
        fetchPlugin: (id: string) => updateExternalPlugin(id.startsWith(EXTERNAL_PREFIX) ? id : EXTERNAL_PREFIX + normalizeSource(id)),
        startPlugin: (id: string) => startPlugin(id),
        stopPlugin: (id: string) => stopPlugin(id),
        removePlugin: (id: string) => uninstallExternalPlugin(id),
        getSettings: (id: string) => (pluginInstances.get(id) as any)?.settings,
    };
}

async function saveRegisterAndStart(p: ExternalPlugin) {
    useExternalPlugins.getState().setPlugin(p);
    register(p);
    refreshUI();
    try {
        await startPlugin(p.id);
        showToast(`Installed ${p.manifest.name}`);
    } catch (e) {
        showToast(`${p.manifest.name} crashed: ${e}`);
    }
    refreshUI();
}

export async function installPluginFromUrl(url: string) {
    const source = normalizeSource(url);
    const id = EXTERNAL_PREFIX + source;
    if (getPlugin(id)) throw new Error("Already installed");

    const { manifest, js } = await fetchFromSource(source);
    const now = Date.now();
    await saveRegisterAndStart({ id, source, manifest, js, update: true, installedAt: now, updatedAt: now });
}

export async function installPluginFromCode(code: string, fileName?: string) {
    const js = code.trim();
    if (!js) throw new Error("Nothing to install");

    if (js.startsWith("{")) {
        let parsed: any;
        try { parsed = JSON.parse(js); } catch { }
        if (looksLikeTheme(parsed)) throw new Error("That's a theme");
        if (parsed?.main && parsed?.name) throw new Error("Use the plugin's link instead");
    }

    const meta = parseMetaHeader(js);
    const name = meta?.name ?? (fileName ? fileName.replace(/\.js$/i, "") : "Local plugin");
    const id = `${EXTERNAL_PREFIX}local:${slugify(name)}`;
    const existing = getPlugin(id);
    const now = Date.now();

    const p: ExternalPlugin = {
        id,
        source: null,
        manifest: { name, description: "", ...meta } as ExternalManifest,
        js,
        update: false,
        installedAt: existing?.installedAt ?? now,
        updatedAt: now,
    };

    if (existing) {
        useExternalPlugins.getState().setPlugin(p);
        register(p);
        await restartIfRunning(id);
        refreshUI();
        showToast(`Updated ${name}`);
        return;
    }

    await saveRegisterAndStart(p);
}

export async function updateExternalPlugin(id: string, { restart = true } = {}) {
    const p = getPlugin(id);
    if (!p) throw new Error("Not installed");
    if (!p.source) throw new Error("Local file, import it again");

    const { manifest, js } = await fetchFromSource(p.source, p);
    const changed = js !== p.js || JSON.stringify(manifest) !== JSON.stringify(p.manifest);
    if (!changed) return false;

    const next = { ...p, manifest, js, updatedAt: Date.now() };
    useExternalPlugins.getState().setPlugin(next);
    register(next);
    if (restart) await restartIfRunning(id);
    refreshUI();
    return true;
}

export async function updateAllExternalPlugins({ restart = true, silent = false } = {}) {
    const ids = Object.values(useExternalPlugins.getState().plugins)
        .filter(p => p.source && p.update)
        .map(p => p.id);

    let updated = 0, failed = 0;
    for (const id of ids) {
        try {
            if (await updateExternalPlugin(id, { restart })) updated++;
        } catch (e) {
            failed++;
            logger.error(`[External] update failed for ${id}`, e);
        }
    }

    if (!silent || updated) showToast(`Updated ${updated}${failed ? `, ${failed} failed` : ""}`);
    return { updated, failed };
}

export function setExternalPluginAutoUpdate(id: string, update: boolean) {
    const p = getPlugin(id);
    if (p) useExternalPlugins.getState().setPlugin({ ...p, update });
}

export async function uninstallExternalPlugin(id: string) {
    const p = getPlugin(id);
    if (!p) return;

    if (isPluginEnabled(id)) {
        try { await stopPlugin(id); } catch (e) { logger.error(`[External] stop failed for ${id}`, e); }
    }

    pluginInstances.delete(id);
    useExternalPlugins.getState().deletePlugin(id);
    try { await purgeStorage(id); } catch { }
    refreshUI();
    showToast(`Uninstalled ${p.manifest.name}`);
}
