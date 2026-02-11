import { useSettings } from "@api/settings";
import { createFileStorage, waitForHydration } from "@api/storage";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

import * as t from "./types";

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
    get: (_, prop: string) => usePluginSettings.getState().settings[prop],
    set: (_, prop: string, value: { enabled: boolean }) => {
        usePluginSettings.getState().updatePluginSetting(prop, value.enabled);
        return true;
    }
});

function assert<T>(condition: T, id: string, attempt: string): asserts condition {
    if (!condition) throw new Error(`[${id}] Attempted to ${attempt}`);
}

async function runPluginLifecycle(id: string, method: "start" | "eagerStart") {
    const instance = pluginInstances.get(id);
    assert(instance, id, `run ${method} on unknown plugin`);

    const settings = useSettings.getState();
    if (settings.safeMode && !isPluginCore(id)) {
        usePluginSettings.getState().updatePluginSetting(id, true);
        return;
    }

    try {
        await instance[method]?.();
        usePluginSettings.getState().updatePluginSetting(id, true);
    } catch (error) {
        method === "start" ? showToast(`[${id}] Failed: ${error}`) : console.error(`[${id}] Failed:`, error);
        throw error;
    }
}

export const startPlugin = (id: string) => runPluginLifecycle(id, "start");
export const startEagerPlugin = (id: string) => runPluginLifecycle(id, "eagerStart");

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

export const findPluginById = (id: string) => pluginInstances.has(id);

async function loadAndInitialize(method: "start" | "eagerStart") {
    await waitForHydration(usePluginSettings);
    const settings = useSettings.getState();
    const { default: rainPlugins } = await import("#rain-plugins");

    for (const [id, plugin] of Object.entries(rainPlugins)) {
        pluginInstances.set(id, plugin as t.rainPlugin);
        if (method === "start") (plugin as t.rainPlugin).id = id;
    }

    const tasks = Array.from(pluginInstances.keys())
        .filter(id => isPluginEnabled(id))
        .map(async id => {
            try {
                method === "start" ? await startPlugin(id) : await startEagerPlugin(id);
            } catch (error) {
                logger.log(`Failed to ${method} ${id}:`, error);
            }
        });

    await Promise.allSettled(tasks);
}

export const initPlugins = () => loadAndInitialize("start");
export const initEagerPlugins = () => loadAndInitialize("eagerStart");

export function definePlugin(
    instance: t.rainPlugin,
): t.rainPlugin {
    // @ts-expect-error
    instance[Symbol.for("rain.plugin")] = true;
    return instance;
}

export function isPluginEnabled(id: string) {
    const setting = usePluginSettings.getState().settings[id];
    return setting?.enabled ?? isPluginCore(id);
}

export const isPluginCore = (id: string) => id.startsWith("core");

export function getPluginSettingsComponent(id: string) {
    return pluginInstances.get(id)?.settings || null;
}
