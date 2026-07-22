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
    name: "FattyFacts",
    description: "Adds fatty fact command",
    author: [Contributors.baxter],
    id: "fattyfacts",
    version: "1.0.0",
    start() {
        unregisters.push(registerCommand(fatFactCommand()));
    },
    stop() {
        unregisters.forEach(unregister => unregister());
    }
});

const fatFactCommand = (): RainApplicationCommand => ({
    name: "fatfact",
    displayName: "fatfact",
    description: "Fatty. Adopted Fatty. Fatty Fatty, No Parents.",
    displayDescription: "Fatty. Adopted Fatty. Fatty Fatty, No Parents.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    execute: async (args, ctx) => {
        try {
            const fact = await fatFact();
            const fixNonce = Date.now().toString();

            MessageActions.sendMessage(
                ctx.channel.id,
                { content: ` <@807170846497570848> ${fact.text}` },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
            console.error("[FatFact] Error:", error);
            // Show toast on error
            showToast("Failed to fetch fat fact", 3000);
        }
    },
});

export const fatFact = async () => {
    const resp = [
        "Overweight and obesity may increase your risk of developing health problems such as diabetes, heart disease, stroke, and certain cancers.",
        "Obesity is a complex chronic disease. Excess body fat can contribute to inflammation and long-term changes throughout the body.",
        "Obesity increases the likelihood of high blood pressure and unhealthy cholesterol levels, both of which are risk factors for heart disease and stroke.",
        "Excess body fat can raise LDL ('bad') cholesterol and triglycerides while lowering HDL ('good') cholesterol.",
        "Sarcopenic obesity can increase the risk of frailty, falls, reduced mobility, and metabolic complications such as insulin resistance.",
        "Carrying excess body fat is associated with an increased risk of cardiovascular disease."
    ];

    return {
        text: resp[Math.floor(Math.random() * resp.length)],
    };
};

const unregisters: (() => void)[] = [];
