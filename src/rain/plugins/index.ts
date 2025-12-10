import { settings } from "@lib/api/settings";
import * as t from "./types";
import { awaitStorage, createStorage, getPreloadedStorage, preloadStorageIfExists, purgeStorage, updateStorage } from "@lib/api/storage";

export const pluginInstances = new Map<string, t.rainPlugin>;
export const pluginSettings = createStorage<t.PluginSettingsStorage>("plugins/settings.json");

function assert<T>(condition: T, id: string, attempt: string): asserts condition {
    if (!condition) throw new Error(`[${id}] Attempted to ${attempt}`);
}

export async function startPlugin(id: string, {} = {}) {
    let pluginInstance: t.rainPlugin;
    pluginInstance = pluginInstances.get(id)!;
    assert(pluginInstance, id, "start a non-existent core plugin");
    pluginInstances.set(id, pluginInstance);
    try {
        pluginInstance.start?.();
    } catch (error) {
        console.error(`[${id}] Failed to start:`, error);
        alert(error);
    }
}

export function stopPlugin(id: string) {
    const instance = pluginInstances.get(id);
    assert(instance, id, "stop a non-started plugin");
    instance.stop?.();
    pluginInstances.delete(id);
}

export async function initPlugins() {
    awaitStorage([pluginSettings]);
    const rainPlugins = await import("#rain-plugins");
    
    for (const [id, plugin] of Object.entries(rainPlugins.default)) {
        pluginInstances.set(id, plugin);
    }
    
    const nonLazyPlugins = [...pluginInstances.entries()]
        .filter(([id, plugin]) => !plugin.islazy)
        .map(([id]) => id);
    
    await Promise.allSettled(nonLazyPlugins.map(async id => {
        startPlugin(id);
    }));
}

export async function initLazyPlugins() {
    awaitStorage([pluginSettings]);
    
    const lazyPlugins = [...pluginInstances.entries()]
        .filter(([id, plugin]) => plugin.islazy)
        .map(([id]) => id);
    
    await Promise.allSettled(lazyPlugins.map(async id => {
        startPlugin(id);
    }));
}

export function definePlugin(
    instance: t.rainPlugin,
): t.rainPlugin {
    // @ts-expect-error
    instance[Symbol.for("rain.plugin")] = true;
    return instance;
}

export function isPluginEnabled(id: string) {
    return Boolean(pluginSettings[id]?.enabled);
}