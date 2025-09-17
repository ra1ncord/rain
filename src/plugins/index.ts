import { plugins } from "./core";
import * as t from "./types";

export function definePlugin(instance: t.PluginInstanceInternal): t.PluginInstanceInternal {
    // @ts-expect-error
    instance[Symbol.for("plugin")] = true;
    return instance;
}

export const pluginInstances = new Map<string, t.PluginInstanceInternal>();
export const registeredPlugins = new Map<string, t.Manifest>();

export async function updatePlugins() {
    for (const id in plugins) {
        const plugin = plugins[id];
        if (plugin) {
            const {
                default: instance,
            } = plugin;
            registeredPlugins.set(id, instance.manifest);
            pluginInstances.set(id, instance);
            pluginInstances.set(id, instance);
        }
    }
}

export async function initPlugins() {
    await Promise.allSettled([...registeredPlugins.keys()].map(async id => {
        await startPlugin(id);
    }));
}

export async function startPlugin(id: string) {
    const pluginInstance = pluginInstances.get(id);
    if (pluginInstance) {
        pluginInstance.start?.();
    }
}