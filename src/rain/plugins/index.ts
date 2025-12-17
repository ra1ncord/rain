import { settings } from "@lib/api/settings";
import * as t from "./types";
import { awaitStorage, createStorage, getPreloadedStorage, preloadStorageIfExists, purgeStorage, updateStorage } from "@lib/api/storage";

export const pluginInstances = new Map<string, t.rainPlugin>();
export const pluginSettings = createStorage<t.PluginSettingsStorage>("plugins/settings.json", {
    dflt: {}
});

function assert<T>(condition: T, id: string, attempt: string): asserts condition {
    if (!condition) throw new Error(`[${id}] Attempted to ${attempt}`);
}

export async function startPlugin(id: string, {} = {}) {
    let pluginInstance: t.rainPlugin;
    pluginInstance = pluginInstances.get(id)!;
    if (!pluginInstance) {
        throw new Error(`Plugin ${id} not found`);
    }
    try {
        pluginInstance.start?.();
        if (!pluginSettings[id]) {
            pluginSettings[id] = { enabled: true };
        } else {
            pluginSettings[id].enabled = true;
        }
    } catch (error) {
        alert(`[${id}] Failed to start:` + error);
        throw error;
    }
}

export async function startEagerPlugin(id: string, {} = {}) {
    let pluginInstance: t.rainPlugin;
    pluginInstance = pluginInstances.get(id)!;
    if (!pluginInstance) {
        throw new Error(`Plugin ${id} not found`);
    }
    try {
        pluginInstance.eagerStart?.();
        if (!pluginSettings[id]) {
            pluginSettings[id] = { enabled: true };
        } else {
            pluginSettings[id].enabled = true;
        }
    } catch (error) {
        console.error(`[${id}] Failed to eager start:`, error);
        throw error;
    }
}

export function stopPlugin(id: string) {
    const instance = pluginInstances.get(id);
    assert(instance, id, "stop a non-started plugin");
    
    try {
        instance.stop?.();
        if (pluginSettings[id]) {
            pluginSettings[id].enabled = false;
        }
    } catch (error) {
        console.error(`[${id}] Failed to stop:`, error);
        throw error;
    }
}

export async function initPlugins() {
    await awaitStorage(pluginSettings);
    
    const rainPlugins = await import("#rain-plugins");
    
    for (const [id, plugin] of Object.entries(rainPlugins.default)) {
        pluginInstances.set(id, plugin);
        plugin.id = id;
    }

    await Promise.allSettled([...pluginInstances.keys()].map(async id => {
        if (isPluginEnabled(id)) {
            await startPlugin(id);
        }
    }));
}

export async function initEagerPlugins() {
    await awaitStorage(pluginSettings);
    
    const rainPlugins = await import("#rain-plugins");
    
    for (const [id, plugin] of Object.entries(rainPlugins.default)) {
        pluginInstances.set(id, plugin);
    }

    await Promise.allSettled([...pluginInstances.keys()].map(async id => {
        if (isPluginEnabled(id)) {
            await startEagerPlugin(id);
        }
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
    if (isCorePlugin(id)) {
        return pluginSettings[id]?.enabled ?? true;
    }
    return pluginSettings[id]?.enabled ?? false;
}

export function isCorePlugin(id: string) {
    if (id.startsWith("core")) {
        return true
    }

    return false;
}

export function getPluginSettingsComponent(id: string): React.ComponentType<any> | null {
    const instance = pluginInstances.get(id);
    if (!instance) return null;

    if (instance.settings) return instance.settings;
    return null;
}