import { findByProps } from "@metro";
import { showConfirmationAlert } from "@api/ui/alerts";
import { storage } from "../../storage";
import { logger } from "@lib/utils/logger";

const MessageActions = findByProps("sendMessage");
const messageUtil = findByProps(
  "sendBotMessage",
  "sendMessage",
  "receiveMessage",
);

/**
 * Fetches a random image from KonoChan.
 * @param isNSFW - Whether to include NSFW content.
 * @returns The URL of the fetched image or null if none are found.
 */
const fetchImage = async (isNSFW: boolean): Promise<string | null> => {
  const baseURL = "https://konachan.com/post.json";
  const tag = isNSFW ? "rating:explicit" : "rating:safe";
  const randomPage = Math.floor(Math.random() * 100);

  try {
    const response = await fetch(
      `${baseURL}?tags=${tag}&limit=1&page=${randomPage}`,
    );
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0].file_url;
  } catch (error) {
    console.error("[KonoChan Randomizer] Error fetching image:", error);
    return null;
  }
};

const showNSFWWarning = (): Promise<boolean> => {
  return new Promise((resolve) => {
    showConfirmationAlert({
      title: "NSFW Content Warning",
      content: "NSFW content can only be sent in NSFW channels!",
      confirmText: "Okay",
      cancelText: "Cancel",
      confirmColor: "brand" as any,
      isDismissable: true,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

// Common options for both commands
const nsfwOption = {
  name: "nsfw",
  description: "Include NSFW content?",
  type: 5,
  required: false,
  displayName: "nsfw",
  displayDescription: "Include NSFW content?",
};

export const konoSelfCommand = {
  name: "konoself",
  displayName: "konoself",
  description: "Fetch a random image from KonoChan for yourself.",
  displayDescription: "Fetch a random image from KonoChan for yourself.",
  options: [nsfwOption],
  execute: async (args: any, ctx: any) => {
    try {
      const options = new Map<string, any>(
        (args || []).map((option: any) => [
          option.name as string,
          option as any,
        ]),
      );
      const isNSFW = options.get("nsfw")?.value || false;

      // Check if channel is NSFW for NSFW content (unless bypass is enabled)
      const bypassEnabled = storage.hiddenSettings?.konochanBypassNsfw || false;
      logger.log(
        `[KonoSelf] NSFW: ${isNSFW}, Channel NSFW: ${ctx.channel.nsfw}, Bypass: ${bypassEnabled}`,
      );

      if (isNSFW && !ctx.channel.nsfw && !bypassEnabled) {
        showNSFWWarning();
        return null;
      }

      const imageUrl = await fetchImage(isNSFW);

      if (!imageUrl) {
        // Silent fail
        return null;
      }

      messageUtil.sendBotMessage(
        ctx.channel.id,
        `Here's your random image: ${imageUrl}`,
      );
      return null;
    } catch (error) {
      console.error("[KonoSelf] Error:", error);
      // Silent fail - no error message in chat
      return null;
    }
  },
  applicationId: "-1",
  inputType: 1,
  type: 1,
};

export const konoSendCommand = {
  name: "konosend",
  displayName: "konosend",
  description: "Fetch a random image from KonoChan and send it to the channel.",
  displayDescription:
    "Fetch a random image from KonoChan and send it to the channel.",
  options: [nsfwOption],
  execute: async (args: any, ctx: any) => {
    try {
      const options = new Map<string, any>(
        (args || []).map((option: any) => [
          option.name as string,
          option as any,
        ]),
      );
      const isNSFW = options.get("nsfw")?.value || false;

      // Check if channel is NSFW for NSFW content (unless bypass is enabled)
      const bypassEnabled = storage.hiddenSettings?.konochanBypassNsfw || false;
      logger.log(
        `[KonoSend] NSFW: ${isNSFW}, Channel NSFW: ${ctx.channel.nsfw}, Bypass: ${bypassEnabled}`,
      );

      if (isNSFW && !ctx.channel.nsfw && !bypassEnabled) {
        showNSFWWarning();
        return null;
      }

      const imageUrl = await fetchImage(isNSFW);

      if (!imageUrl) {
        // Silent fail
        return null;
      }

      const fixNonce = Date.now().toString();
      MessageActions.sendMessage(
        ctx.channel.id,
        { content: imageUrl },
        void 0,
        {
          nonce: fixNonce,
        },
      );
      return null;
    } catch (error) {
      console.error("[KonoSend] Error:", error);
      // Silent fail - no error message in chat
      return { type: 4 };
    }
  },
  applicationId: "-1",
  inputType: 1,
  type: 1,
};
