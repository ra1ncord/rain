import { logger } from "@lib/utils/logger";

import deafen from "./deafen";
import rotate from "./rotate";
import split from "./split";
import { cheeseburger, FeatureId } from "./storage";
import updates from "./updates";
import volume from "./volume";

interface Feature {
    start(): unknown;
    stop(): unknown;
}

export const FEATURES: Record<FeatureId, Feature> = { volume, deafen, split, rotate, updates };

const running = new Set<FeatureId>();
const chains = new Map<FeatureId, Promise<unknown>>();
let pluginRunning = false;

function enqueue(id: FeatureId, fn: () => unknown): Promise<unknown> {
    const next = (chains.get(id) ?? Promise.resolve()).then(fn);
    chains.set(id, next.catch(() => { }));
    return next;
}

const startFeature = (id: FeatureId) => enqueue(id, async () => {
    if (running.has(id)) return;
    try {
        await FEATURES[id].start();
        running.add(id);
    } catch (e) {
        logger.error(`[Cheeseburger] ${id}`, e);
        try {
            FEATURES[id].stop();
        } catch { }
    }
});

const stopFeature = (id: FeatureId) => enqueue(id, () => {
    if (!running.has(id)) return;
    running.delete(id);
    try {
        FEATURES[id].stop();
    } catch (e) {
        logger.error(`[Cheeseburger] ${id}`, e);
    }
});

export async function startAll() {
    pluginRunning = true;
    for (const id of Object.keys(FEATURES) as FeatureId[]) {
        if (cheeseburger[id] !== false) await startFeature(id);
    }
}

export async function stopAll() {
    pluginRunning = false;
    await Promise.all((Object.keys(FEATURES) as FeatureId[]).map(stopFeature));
}

export function setFeature(id: FeatureId, on: boolean) {
    cheeseburger[id] = on;
    if (!pluginRunning) return;
    void (on ? startFeature(id) : stopFeature(id));
}
