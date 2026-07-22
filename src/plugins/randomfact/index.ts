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
    name: "RandomFacts",
    description: "Adds a command to send random fun facts",
    author: [Contributors.baxter],
    id: "animalfacts",
    version: "1.0.0",
    start() {
            unregisters.push(registerCommand(factCommand())),
    },
    stop() {
        unregisters.forEach(unregister => unregister());
    }
});

const factCommand = (): RainApplicationCommand => ({
    name: "randomfact",
    displayName: "randomfact",
    description: "Sends a random fact.",
    displayDescription: "Sends a random fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await randomFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[RandomFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch random fact", 3000);
        }
    },
});

export const catFact = async () => {
    const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
    const resp = await response.json();
    return {
        text: resp.text,
    };
};

const unregisters: (() => void)[] = [];
