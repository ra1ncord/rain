import { findByProps } from "@metro";
import { showToast } from "@api/ui/toasts";
import { ReactNative as RN } from "@metro/common";

interface CommandOption {
  name: string;
  value: any;
}

const APIUtils = findByProps("getAPIBaseURL", "get");
const MessageActions = findByProps("sendMessage");

// Helper functions for fetching messages
const getFirstGuildMessage = async (
  guildId: string,
  userId?: string,
  channelId?: string,
) => {
  const userParam = userId ? `&author_id=${userId}` : "";
  const channelParam = channelId ? `&channel_id=${channelId}` : "";
  const minIdParam = userId ? "" : `&min_id=0`;
  return (
    await APIUtils.get({
      url: `/guilds/${guildId}/messages/search`,
      query: `include_nsfw=true${userParam}${channelParam}${minIdParam}&sort_by=timestamp&sort_order=asc&offset=0`,
    })
  ).body.messages[0][0];
};

const getFirstDMMessage = async (dmId: string, userId?: string) => {
  const userParam = userId ? `&author_id=${userId}` : "";
  const minIdParam = userId ? "" : `&min_id=0`;
  return (
    await APIUtils.get({
      url: `/channels/${dmId}/messages/search`,
      query: `&sort_by=timestamp&sort_order=asc&offset=0${userParam}${minIdParam}`,
    })
  ).body.messages[0][0];
};

export const firstMessageCommand = {
  name: "firstmessage",
  displayName: "firstmessage",
  description: "Tired of scrolling to first message?",
  displayDescription: "Tired of scrolling to first message?",
  options: [
    {
      name: "user",
      displayName: "user",
      description: "Target user to get their first message in this server/dm",
      displayDescription:
        "Target user to get their first message in this server/dm",
      type: 6, // USER type
      required: false,
    },
    {
      name: "channel",
      displayName: "channel",
      description: "Target channel to get first message of",
      displayDescription: "Target channel to get first message of",
      type: 7, // CHANNEL type
      required: false,
    },
    {
      name: "send",
      displayName: "send",
      description: "Whether to send the resulting url",
      displayDescription: "Whether to send the resulting url",
      type: 5, // BOOLEAN type
      required: false,
    },
  ],
  execute: async (args: any, ctx: any) => {
    try {
      const options = new Map(
        args.map((option: CommandOption) => [option.name, option]),
      );
      const user = (options.get("user") as CommandOption)?.value;
      const channel = (options.get("channel") as CommandOption)?.value;
      const send = (options.get("send") as CommandOption)?.value;

      const guildId = ctx.guild?.id;
      const channelId = ctx.channel.id;
      const isDM = ctx.channel.type === 1;

      // Channel option is not valid in DMs
      if (isDM && channel) {
        showToast("Channel option cannot be used in DMs", 3000);
        return null;
      }

      let result = "https://discord.com/channels/";
      let message;

      if (isDM) {
        // DM logic: only user parameter matters
        message = await getFirstDMMessage(channelId, user);
        result += `@me/${channelId}/${message.id}`;
      } else {
        // Guild logic: both user and channel parameters can be used
        message = await getFirstGuildMessage(guildId, user, channel);
        // Use the specified channel if provided, otherwise use the message's channel
        const targetChannel = channel || message.channel_id;
        result += `${guildId}/${targetChannel}/${message.id}`;
      }

      if (send) {
        const fixNonce = Date.now().toString();
        MessageActions.sendMessage(
          ctx.channel.id,
          { content: result },
          void 0,
          { nonce: fixNonce },
        );
      } else {
        RN.Linking.openURL(result);
      }

      return null;
    } catch (error) {
      console.error("[FirstMessage] Error:", error);
      // Show toast on error
      showToast("Failed to fetch first message", 3000);
      // Silent fail
      return null;
    }
  },
  applicationId: "-1",
  inputType: 1,
  type: 1,
};
