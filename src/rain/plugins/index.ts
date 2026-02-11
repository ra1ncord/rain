import { useSettings } from "@api/settings";
import { createFileStorage, waitForHydration } from "@api/storage";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
                        [id]: { enabled },
                    },
                }));
            },
            getPluginSetting: (id: string) => get().settings[id],
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "plugin-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/settings.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export const pluginSettings = new Proxy({} as t.PluginSettingsStorage, {
    get: (_, prop: string) => usePluginSettings.getState().settings[prop],
    set: (_, prop: string, value: { enabled: boolean }) => {
        usePluginSettings.getState().updatePluginSetting(prop, value.enabled);
        return true;
    },
});

function assert<T>(condition: T, id: string, attempt: string): asserts condition {
    if (!condition) throw new Error(`[${id}] Attempted to ${attempt}`);
}

async function runPluginLifecycle(id: string, method: "start" | "eagerStart"): Promise<void> {
    const instance = pluginInstances.get(id);
    assert(instance, id, `run ${method} on unknown plugin`);

    const settings = useSettings.getState();
    if (settings.safeMode && !isPluginCore(id)) {
        logger.log(`[${id}] Skipped in safe mode`);
        return;
    }

    try {
        await instance[method]?.();
        usePluginSettings.getState().updatePluginSetting(id, true);
    } catch (error) {
        const errorMsg = `[${id}] Failed: ${error}`;
        method === "start" ? showToast(errorMsg) : console.error(errorMsg, error);
        throw error;
    }
}

export const startPlugin = (id: string): Promise<void> => runPluginLifecycle(id, "start");
export const startEagerPlugin = (id: string): Promise<void> => runPluginLifecycle(id, "eagerStart");

export async function stopPlugin(id: string): Promise<void> {
    const instance = pluginInstances.get(id);
    assert(instance, id, "stop a non-started plugin");

    try {
        await instance.stop?.();
        usePluginSettings.getState().updatePluginSetting(id, false);
    } catch (error) {
        console.error(`[${id}] Failed to stop:`, error);
        throw error;
    }
}

export const findPluginById = (id: string): boolean => pluginInstances.has(id);

export const isPluginCore = (id: string): boolean => id.startsWith("core");

export function isPluginEnabled(id: string): boolean {
    const setting = usePluginSettings.getState().settings[id];
    return setting?.enabled ?? isPluginCore(id);
}

async function loadAndInitialize(method: "start" | "eagerStart"): Promise<void> {
    await waitForHydration(usePluginSettings);

    const { default: rainPlugins } = await import("#rain-plugins");

    for (const [id, plugin] of Object.entries(rainPlugins)) {
        const instance = plugin as t.rainPlugin;
        instance.id = id;
        pluginInstances.set(id, instance);
    }

    const tasks = Array.from(pluginInstances.keys())
        .filter(isPluginEnabled)
        .map(async id => {
            try {
                await (method === "start" ? startPlugin(id) : startEagerPlugin(id));
            } catch (error) {
                logger.log(`Failed to ${method} ${id}:`, error);
            }
        });

    await Promise.allSettled(tasks);
}

export const initPlugins = (): Promise<void> => loadAndInitialize("start");
export const initEagerPlugins = (): Promise<void> => loadAndInitialize("eagerStart");

export function definePlugin(instance: t.rainPlugin): t.rainPlugin {
    // @ts-expect-error
    instance[Symbol.for("rain.plugin")] = true;
    return instance;
}

export function getPluginSettingsComponent(id: string): (() => JSX.Element) | null {
    return pluginInstances.get(id)?.settings || null;
}
