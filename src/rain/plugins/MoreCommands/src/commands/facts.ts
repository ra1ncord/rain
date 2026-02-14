import { findByProps } from "@metro";
import { showToast } from "@api/ui/toasts";
import { storage } from "../../storage";
import { catFact, dogFact, uselessFact } from "../utils/api";

const MessageActions = findByProps("sendMessage");

// Helper function to format fact response
const formatFactResponse = (fact: { text: string; source?: string; length?: number }) => {
    let response = fact.text;
    if (storage.factSettings?.includeCitation && fact.source) {
        response += `\n\nSource: ${fact.source}`;
    }
    return response;
};

export const catFactCommand = {
    name: "catfact",
    displayName: "catfact",
    description: "Sends a random cat fact.",
    displayDescription: "Sends a random cat fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args: any, ctx: any) => {
        try {
            const fact = await catFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );

            // return NOTHING - let client handle the acknowledgement
            return null;
        } catch (error) {
            console.error("[CatFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch cat fact", 3000);
            // Return nothing on error too
            return null;
        }
    },
};

export const dogFactCommand = {
    name: "dogfact",
    displayName: "dogfact",
    description: "Sends a dog fact.",
    displayDescription: "Sends a dog fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args: any, ctx: any) => {
        try {
            const fact = await dogFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );

            return null;
        } catch (error) {
            console.error("[DogFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch dog fact", 3000);
            return null;
        }
    },
};

export const uselessFactCommand = {
    name: "useless",
    displayName: "useless",
    description: "Sends a useless fact.",
    displayDescription: "Sends a useless fact.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args: any, ctx: any) => {
        try {
            const fact = await uselessFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: formatFactResponse(fact) },
                void 0,
                { nonce: fixNonce }
            );

            return null;
        } catch (error) {
            console.error("[UselessFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch useless fact", 3000);
            return null;
        }
    },
};
