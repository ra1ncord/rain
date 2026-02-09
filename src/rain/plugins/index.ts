import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

import * as t from "./types";
import { createFileStorage, waitForHydration } from "@api/storage";
import { logger } from "@lib/utils/logger";

export const pluginInstances = new Map<string, t.rainPlugin>();

interface PluginSettingsStore {
    settings: t.PluginSettingsStorage;
    _hasHydrated: boolean;
    updatePluginSetting: (id: string, enabled: boolean) => void;
    getPluginSetting: (id: string) => { enabled: boolean } | undefined;
    setHasHydrated: (state: boolean) => void;
}

export const usePluginSettings = create<PluginSettingsStore>()(
    persist(
        (set, get) => ({
            settings: {},
            _hasHydrated: false,
            updatePluginSetting: (id: string, enabled: boolean) => {
                set(state => ({
                    settings: {
                        ...state.settings,
                        [id]: { enabled }
                    }
                }));
            },
            getPluginSetting: (id: string) => {
                return get().settings[id];
            },
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            }
        }),
        {
            name: "plugin-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/settings.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const pluginSettings = new Proxy({} as t.PluginSettingsStorage, {
    get(target, prop: string) {
        return usePluginSettings.getState().settings[prop];
    },
    set(target, prop: string, value: { enabled: boolean }) {
        usePluginSettings.getState().updatePluginSetting(prop, value.enabled);
        return true;
    }
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
        usePluginSettings.getState().updatePluginSetting(id, true);
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
        usePluginSettings.getState().updatePluginSetting(id, true);
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
        usePluginSettings.getState().updatePluginSetting(id, false);
    } catch (error) {
        console.error(`[${id}] Failed to stop:`, error);
        throw error;
    }
}

export function findPluginById(id: string) {
    if (pluginInstances.has(id)) {
        return true;
    } else {
        return false;
    }
}

export async function initPlugins() {
    await waitForHydration(usePluginSettings);

    const rainPlugins = await import("#rain-plugins");

    for (const [id, plugin] of Object.entries(rainPlugins.default)) {
        pluginInstances.set(id, plugin);
        plugin.id = id;
    }

    await Promise.allSettled([...pluginInstances.keys()].map(async id => {
        if (isPluginEnabled(id)) {
            try {
                await startPlugin(id);
            } catch(error) {
                logger.log("Failed to start ", id, " because of ", error)
            }
        }
    }));
}

export async function initEagerPlugins() {
    await waitForHydration(usePluginSettings);

    const rainPlugins = await import("#rain-plugins");

    for (const [id, plugin] of Object.entries(rainPlugins.default)) {
        pluginInstances.set(id, plugin);
    }

    await Promise.allSettled([...pluginInstances.keys()].map(async id => {
        if (isPluginEnabled(id)) {
            try {
                await startEagerPlugin(id);
            } catch(error) {
                logger.log("Failed to eagerStart ", id, " because of ", error)
            }
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
    const setting = usePluginSettings.getState().settings[id];

    if (isPluginCore(id)) {
        return setting?.enabled ?? true;
    }

    return setting?.enabled ?? false;
}

export function isPluginCore(id: string) {
    if (id.startsWith("core")) {
        return true;
    }
    return false;
}

export function getPluginSettingsComponent(id: string): React.ComponentType<any> | null {
    const instance = pluginInstances.get(id);
    if (!instance) return null;
    if (instance.settings) return instance.settings;
    return null;
}
