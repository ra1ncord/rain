import * as t from "./types";
import { lazy } from "react";

export const pluginInstances = new Map<string, t.rainPlugin>();

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
    const rainPlugins = await import("#rain-plugins");
    
    for (const [id, plugin] of Object.entries(rainPlugins.default)) {
        pluginInstances.set(id, plugin);
    }
    
    await Promise.allSettled([...pluginInstances.keys()].map(async id => {
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

export function registerPlugin(id: string, plugin: t.rainPlugin) {
    Object.defineProperty(plugin, "$id", {
        value: id,
        writable: false,
        enumerable: false,
    });
    
    return (relativePath: string) => {
        Object.defineProperty(plugin, "$path", {
            value: relativePath || "<unknown>",
            writable: false,
            enumerable: false,
        });
        
        return plugin;
    };
}