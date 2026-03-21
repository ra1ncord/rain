import { registerCommand } from "@api/commands";
import { RainApplicationCommand } from "@api/commands/types";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

const MessageActions = findByProps("sendMessage");

// Helper function to format fact response
const formatFactResponse = (fact: { text: string; source?: string; length?: number }) => {
    const response = fact.text;
    return response;
};

export default definePlugin({
    name: "AnimalFacts",
    description: "Adds the catfact and dogfact commands",
    author: [Contributors.jdev082],
    id: "animalfacts",
    version: "1.0.0",
    start() {
        unregisters.push(registerCommand(catFactCommand()));
        unregisters.push(registerCommand(dogFactCommand()));
    },
    stop() {
        unregisters.forEach(unregister => unregister());
    }
});

const catFactCommand = (): RainApplicationCommand => ({
    name: "catfact",
    displayName: "catfact",
    description: "Sends a random cat fact.",
    displayDescription: "Sends a random cat fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await catFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[CatFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch cat fact", 3000);
        }
    },
});

const dogFactCommand = (): RainApplicationCommand => ({
    name: "dogfact",
    displayName: "dogfact",
    description: "Sends a dog fact.",
    displayDescription: "Sends a dog fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await dogFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[DogFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch dog fact", 3000);
        }
    },
});

export const dogFact = async () => {
    const response = await fetch("https://dogapi.dog/api/v2/facts?limit=1");
    const resp = await response.json();
    return {
        text: resp.data["0"].attributes.body,
    };
};

export const catFact = async () => {
    const response = await fetch("https://catfact.ninja/fact");
    const resp = await response.json();
    return {
        text: resp.fact,
        length: resp.length,
    };
};

const unregisters: (() => void)[] = [];
