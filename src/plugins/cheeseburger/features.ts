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
let pluginRunning = false;

async function startFeature(id: FeatureId) {
    if (running.has(id)) return;
    running.add(id);
    try {
        await FEATURES[id].start();
    } catch (e) {
        running.delete(id);
        logger.error(`[Cheeseburger] ${id}`, e);
    }
}

function stopFeature(id: FeatureId) {
    if (!running.has(id)) return;
    running.delete(id);
    try {
        FEATURES[id].stop();
    } catch (e) {
        logger.error(`[Cheeseburger] ${id}`, e);
    }
}

export async function startAll() {
    pluginRunning = true;
    for (const id of Object.keys(FEATURES) as FeatureId[]) {
        if (cheeseburger[id] !== false) await startFeature(id);
    }
}

export function stopAll() {
    pluginRunning = false;
    for (const id of [...running]) stopFeature(id);
}

export function setFeature(id: FeatureId, on: boolean) {
    cheeseburger[id] = on;
    if (!pluginRunning) return;
    if (on) void startFeature(id);
    else stopFeature(id);
}
