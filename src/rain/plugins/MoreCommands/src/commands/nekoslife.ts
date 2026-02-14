import { findByProps } from "@metro";
import { showToast } from "@api/ui/toasts";
import { findAssetId } from "@api/assets";

const MessageActions = findByProps("sendMessage");
const messageUtil = findByProps("sendBotMessage", "sendMessage", "receiveMessage");

interface NekosLifeResult {
  url: string;
}

// Valid SFW categories for validation
const validSfwCategories = [
    "avatar", "classic", "cuddle", "fox_girl", "gecg", "holo",
    "kemonomimi", "kiss", "neko", "ngif", "smug", "spank",
    "tickle", "waifu", "wallpaper", "woof"
];

async function fetchNekosLifeImages(category: string, count: number): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < count; i++) {
        try {
            // Add delay between requests to avoid rate limiting
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const response = await fetch(`https://nekos.life/api/v2/img/${category}`);
            if (!response.ok) {
                console.error(`[NekosLife] API request failed: ${response.status}`);
                continue;
            }

            const data: NekosLifeResult = await response.json();
            if (data.url) {
                urls.push(data.url);
            }
        } catch (error) {
            console.error(`[NekosLife] Error fetching image ${i + 1}:`, error);
        }
    }

    return urls;
}

function isValidSfwCategory(category: string): boolean {
    if (!category || typeof category !== "string") return false;
    return validSfwCategories.includes(category.toLowerCase().trim());
}

export const nekoslifeCommand = {
    name: "nekoslife",
    displayName: "nekoslife",
    description: "Get SFW images/gifs from nekos.life",
    displayDescription: "Get SFW images/gifs from nekos.life",
    options: [
        {
            name: "category",
            displayName: "category",
            description: "Category name (e.g. neko, waifu, cuddle, etc.)",
            displayDescription: "Category name (e.g. neko, waifu, cuddle, etc.)",
            type: 3, // String - free text input
            required: true,
        },
        {
            name: "limit",
            displayName: "limit",
            description: "Number of images (1-5, default: 1)",
            displayDescription: "Number of images (1-5, default: 1)",
            type: 4, // Integer
            required: false,
        },
        {
            name: "send",
            displayName: "send",
            description: "Send to chat",
            displayDescription: "Send to chat",
            type: 5, // Boolean
            required: false,
        },
        {
            name: "ephemeral",
            displayName: "ephemeral",
            description: "Send as ephemeral message (only you can see)",
            displayDescription: "Send as ephemeral message (only you can see)",
            type: 5, // Boolean
            required: false,
        }
    ],
    execute: async (args: any, ctx: any) => {
        try {
            console.log("[NekosLife] Command executed with args:", args);

            // Parse arguments
            const categoryInput = args.find((arg: any) => arg.name === "category")?.value;
            const limitInput = args.find((arg: any) => arg.name === "limit")?.value;
            const shouldSend = args.find((arg: any) => arg.name === "send")?.value || false;
            const isEphemeral = args.find((arg: any) => arg.name === "ephemeral")?.value || false;

            console.log("[NekosLife] Parsed values:", { categoryInput, limitInput, shouldSend, isEphemeral });

            if (!categoryInput || typeof categoryInput !== "string") {
                const errorMsg = "❌ Category is required! Examples: neko, waifu, cuddle, kiss";
                console.error("[NekosLife] No category provided");

                if (isEphemeral) {
                    return {
                        type: 4,
                        data: {
                            content: errorMsg,
                            flags: 64,
                        },
                    };
                }
                showToast(errorMsg, findAssetId("CircleXIcon"));
                return null;
            }

            // Clean and validate category
            const category = categoryInput.toLowerCase().trim();

            if (!isValidSfwCategory(category)) {
                const errorMsg = `❌ Invalid SFW category "${categoryInput}". Valid: neko, waifu, cuddle, kiss, holo, etc.`;

                if (isEphemeral) {
                    return {
                        type: 4,
                        data: {
                            content: errorMsg,
                            flags: 64,
                        },
                    };
                }
                showToast(errorMsg, findAssetId("CircleXIcon"));
                return null;
            }

            // Parse and validate limit
            let limit = 1;
            if (limitInput !== undefined && limitInput !== null) {
                limit = parseInt(String(limitInput)) || 1;
                limit = Math.max(1, Math.min(5, limit)); // Clamp between 1-5
            }

            console.log("[NekosLife] Processing SFW request:", { category, limit, shouldSend, isEphemeral });

            // Show loading toast
            if (!isEphemeral) {
                showToast(`Fetching ${limit} SFW image(s) from nekos.life...`, findAssetId("DownloadIcon"));
            }

            const urls = await fetchNekosLifeImages(category, limit);

            if (urls.length === 0) {
                const errorMsg = "❌ Failed to fetch images from nekos.life. Try again later!";
                if (isEphemeral) {
                    return {
                        type: 4,
                        data: {
                            content: errorMsg,
                            flags: 64,
                        },
                    };
                }
                showToast(errorMsg, findAssetId("CircleXIcon"));
                return null;
            }

            const content = urls.join("\n");

            if (isEphemeral) {
                console.log("[NekosLife] Sending ephemeral response");
                return {
                    type: 4,
                    data: {
                        content,
                        flags: 64,
                    },
                };
            } else if (shouldSend) {
                console.log("[NekosLife] Sending to chat");
                const fixNonce = Date.now().toString();
                MessageActions.sendMessage(ctx.channel.id, { content }, void 0, { nonce: fixNonce });
                return null;
            } else {
                console.log("[NekosLife] Sending as bot message");
                messageUtil.sendBotMessage(ctx.channel.id, content);
                return null;
            }
        } catch (error) {
            console.error("[NekosLife] Command error:", error);
            const errorMessage = "❌ An error occurred while fetching images.";

            const isEphemeral = args?.find?.((arg: any) => arg.name === "ephemeral")?.value ?? false;

            if (isEphemeral) {
                return {
                    type: 4,
                    data: {
                        content: errorMessage,
                        flags: 64,
                    },
                };
            }
            showToast(errorMessage, findAssetId("CircleXIcon"));
            return null;
        }
    },
    applicationId: "-1",
    inputType: 1,
    type: 1,
};
