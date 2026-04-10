import { registerCommand } from "@api/commands";
import { RainApplicationCommand } from "@api/commands/types";
import { waitForHydration } from "@api/storage";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";

import AnimalCommandsSettings from "./settings";
import { AnimalSource, ensureImageUrl, sources } from "./sources";
import { ensureAnimalDefaults, getAnimalSourceId, isAnimalEnabled, useAnimalCommandsSettings } from "./storage";
import { Contributors } from "@rain/Developers";

const MessageActions = findByProps("sendMessage");

export default definePlugin({
    name: "AnimalCommands",
    description: "Adds multiple animal image commands",
    author: [Contributors.Vaiskiainen],
    id: "animalcommands",
    version: "1.0.0",
    async start() {
        await waitForHydration(useAnimalCommandsSettings);
        ensureAnimalDefaults();
        for (const source of sources) {
            unregisters.push(registerCommand(buildCommand(source)));
        }
    },
    stop() {
        for (const unregister of unregisters) unregister();
        unregisters.length = 0;
    },
    settings: AnimalCommandsSettings,
});

const getSelectedImageSource = (animal: AnimalSource) => {
    const selectedId = getAnimalSourceId(animal.id);
    return animal.sources.find(source => source.id === selectedId) ?? animal.sources[0];
};

const buildCommand = (source: AnimalSource): RainApplicationCommand => ({
    name: source.name,
    displayName: source.name,
    description: source.description,
    displayDescription: source.description,
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => !isAnimalEnabled(source.id),
    execute: async (_args, ctx) => {
        if (!isAnimalEnabled(source.id)) {
            showToast(`${source.name} command is disabled in settings`, 3000);
            return;
        }
        const imageSource = getSelectedImageSource(source);
        if (!imageSource) {
            showToast(`No source configured for ${source.name}`, 3000);
            return;
        }
        try {
            const url = await ensureImageUrl(await imageSource.getImageUrl());
            const nonce = Date.now().toString();
            MessageActions.sendMessage(
                ctx.channel.id,
                { content: url },
                void 0,
                { nonce }
            );
        } catch (error) {
            console.error(`[${source.id}] Failed to fetch image:`, error);
            showToast(`Failed to fetch ${source.name} image`, 3000);
        }
    },
});

const unregisters: Array<() => void> = [];
