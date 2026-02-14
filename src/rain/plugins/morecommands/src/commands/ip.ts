import { findByProps } from "@metro";
import { showToast } from "@api/ui/toasts";
import { findAssetId } from "@api/assets";

const MessageActions = findByProps("sendMessage");
const messageUtil = findByProps("sendBotMessage", "sendMessage", "receiveMessage");

interface IpWhoisResponse {
  success: boolean;
  ip: string;
  type: string;
  as: string;
  org: string;
  isp: string;
  continent: string;
  country: string;
  country_capital: string;
  city: string;
  region: string;
  country_phone: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  completed_requests: number;
}

export const ipCommand = {
    name: "ip",
    displayName: "ip",
    description: "IP address and domain lookup",
    displayDescription: "IP address and domain lookup",
    options: [
        {
            name: "query",
            displayName: "query",
            description: "Enter IPv4/IPv6 address or domain name",
            displayDescription: "Enter IPv4/IPv6 address or domain name",
            type: 3, // String
            required: true,
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
            const query = args.find((arg: any) => arg.name === "query")?.value;
            const shouldSend = args.find((arg: any) => arg.name === "send")?.value || false;
            const isEphemeral = args.find((arg: any) => arg.name === "ephemeral")?.value || false;

            if (!query) {
                const errorMsg = "❌ Query parameter is required!";
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

            // Show loading toast
            if (!isEphemeral && !shouldSend) {
                showToast(`Looking up IP information for ${query}...`, findAssetId("DownloadIcon"));
            }

            // Build API URL with all requested fields
            const url = `http://ipwhois.app/json/${encodeURIComponent(query)}?objects=` +
                  "success,ip,type,as,org,isp,continent,country,country_capital,city,region," +
                  "country_phone,latitude,longitude,timezone,currency,completed_requests";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: IpWhoisResponse = await response.json();

            if (!data.success) {
                const errorMsg = `❌ Failed to lookup IP information for: ${query}`;
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

            // Format the response as code block
            const formattedData = JSON.stringify(data, null, 4);
            const content = `\`\`\`json\n${formattedData}\n\`\`\``;

            if (isEphemeral) {
                return {
                    type: 4,
                    data: {
                        content,
                        flags: 64,
                    },
                };
            } else if (shouldSend) {
                const fixNonce = Date.now().toString();
                MessageActions.sendMessage(ctx.channel.id, { content }, void 0, { nonce: fixNonce });
                return { type: 4 };
            } else {
                // Send as bot message (ephemeral-like)
                messageUtil.sendBotMessage(ctx.channel.id, content);
                return null;
            }
        } catch (error) {
            console.error("[IP] Command error:", error);
            const errorMessage = `❌ An error occurred while looking up IP information: ${(error as Error).message || "Unknown error"}`;

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
