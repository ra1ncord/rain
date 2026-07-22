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
    description: "Adds miscellaneous animal fact commands",
    author: [Contributors.jdev082, Contributors.baxter],
    id: "animalfacts",
    version: "1.0.0",
    start() {
        unregisters.push(registerCommand(catFactCommand()));
        unregisters.push(registerCommand(dogFactCommand()));
        unregisters.push(registerCommand(duckFactCommand()));
        unregisters.push(registerCommand(foxFactCommand()));
        unregisters.push(registerCommand(pandaFactCommand()));
        unregisters.push(registerCommand(racoonFactCommand()));
        unregisters.push(registerCommand(koalaFactCommand()));
        unregisters.push(registerCommand(whaleFactCommand()));
        unregisters.push(registerCommand(kangarooFactCommand()));
        unregisters.push(registerCommand(birdFactCommand()));
        unregisters.push(registerCommand(redPandaFactCommand()));
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

const duckFactCommand = (): RainApplicationCommand => ({
    name: "duckfact",
    displayName: "duckfact",
    description: "Sends a duck fact.",
    displayDescription: "Sends a duck fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await duckFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[DuckFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch duck fact", 3000);
        }
    },
});

const foxFactCommand = (): RainApplicationCommand => ({
    name: "foxfact",
    displayName: "foxfact",
    description: "Sends a fox fact.",
    displayDescription: "Sends a fox fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await foxFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[FoxFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch fox fact", 3000);
        }
    },
});

const pandaFactCommand = (): RainApplicationCommand => ({
    name: "pandafact",
    displayName: "pandafact",
    description: "Sends a panda fact.",
    displayDescription: "Sends a panda fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await pandaFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[PandaFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch panda fact", 3000);
        }
    },
});

const birdFactCommand = (): RainApplicationCommand => ({
    name: "birdfact",
    displayName: "birdfact",
    description: "Sends a bird fact.",
    displayDescription: "Sends a bird fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await birdFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[BirdFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch bird fact", 3000);
        }
    },
});

const koalaFactCommand = (): RainApplicationCommand => ({
    name: "koalafact",
    displayName: "koalafact",
    description: "Sends a koala fact.",
    displayDescription: "Sends a koala fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await koalaFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[KoalaFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch koala fact", 3000);
        }
    },
});

const racoonFactCommand = (): RainApplicationCommand => ({
    name: "racoonfact",
    displayName: "racoonfact",
    description: "Sends a racoon fact.",
    displayDescription: "Sends a racoon fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await racoonFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[RacoonFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch racoon fact", 3000);
        }
    },
});

const whaleFactCommand = (): RainApplicationCommand => ({
    name: "whalefact",
    displayName: "whalefact",
    description: "Sends a whale fact.",
    displayDescription: "Sends a whale fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await whaleFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[WhaleFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch whale fact", 3000);
        }
    },
});

const kangarooFactCommand = (): RainApplicationCommand => ({
    name: "kangaroofact",
    displayName: "kangaroofact",
    description: "Sends a kangaroo fact.",
    displayDescription: "Sends a kangaroo fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await kangarooFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[KangarooFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch kangaroo fact", 3000);
        }
    },
});

const redPandaFactCommand = (): RainApplicationCommand => ({
    name: "redpandafact",
    displayName: "redpandafact",
    description: "Sends a red panda fact.",
    displayDescription: "Sends a red panda fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await redPandaFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[RedPandaFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch red panda fact", 3000);
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

export const duckFact = async () => {
    const response = await fetch("https://03vpefsitf.execute-api.eu-west-1.amazonaws.com/prod/");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const foxFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/fox");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const pandaFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/panda");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const birdFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/bird");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const koalaFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/koala");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const racoonFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/racoon");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const kangarooFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/kangaroo");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const whaleFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/whale");
    const resp = await response.json();
    return {
        text: resp.fact,
    };
};

export const redPandaFact = async () => {
    const response = await fetch("https://api.some-random-api.com/animal/red_panda");
    const resp = await response.json();
    return {
        text: resp.fact,
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
