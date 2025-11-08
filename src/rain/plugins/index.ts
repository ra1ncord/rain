import * as t from "./types";
import { rainPlugin } from "./types";

export const corePluginInstances = new Map<string, t.rainPlugin>();

export const registeredPlugins = new Map<string, t.rainPlugin>();
export const pluginInstances = new Map<string, t.rainPlugin>();

function assert<T>(condition: T, id: string, attempt: string): asserts condition {
    if (!condition) throw new Error(`[${id}] Attempted to ${attempt}`);
}

export async function startPlugin(id: string, { } = {}) {
    let pluginInstance: t.rainPlugin;
    pluginInstance = corePluginInstances.get(id)!;
    assert(pluginInstance, id, "start a non-existent core plugin");
    pluginInstances.set(id, pluginInstance);
    try {
        pluginInstance.start?.();
    } catch (error) {
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
    
    const corePlugins = getCorePlugins();
    for (const [id, plugin] of Object.entries(corePlugins)) {
        corePluginInstances.set(id, plugin);
    }
    
    await Promise.allSettled([...corePluginInstances.keys()].map(async id => {
        startPlugin(id);
    }));
}

export const getCorePlugins = (): Record<string, rainPlugin> => ({
    "rain.core.settings": require("./.core/settings").default,
    "rain.core.badges": require("./.core/badges").default,
    "rain.dummy": require("./dummy").default,
});

export function definePlugin(
  instance: rainPlugin,
): rainPlugin {
  // @ts-expect-error
  instance[Symbol.for("rain.plugin")] = true;
  return instance;
}
