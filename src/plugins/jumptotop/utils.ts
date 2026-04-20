import { findByProps, findByStoreName } from "@metro";

const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const ChannelStore = findByStoreName("ChannelStore");
const messageUtil = findByProps("jumpToMessage");

const { openUrl } = findByProps("openUrl");

export function jumpToTopOfCurrentChannel() {
    const currentChannelId = SelectedChannelStore.getChannelId();
    const channelDetails = ChannelStore.getChannel(currentChannelId);

    messageUtil.jumpToMessage({
        channelId: channelDetails.id,
        messageId: channelDetails.id,
        flash: true,
        jumpType: "ANIMATED",
    });
}

export function jumpToTopOfDifferentChannel(
    guildId: string,
    channelId: string,
) {
    openUrl(
        `https://discord.com/channels/${guildId}/${channelId}/${channelId}`,
    );
}

export function jumpToTopOfForum(guildId: string, threadId: string) {
    openUrl(`https://discord.com/channels/${guildId}/${threadId}/${threadId}`);
}

export function jumpToTop(
    isNotCurrentChannel: boolean,
    details: { guildId: string; channelId: string; },
): () => void {
    return isNotCurrentChannel
        ? () => jumpToTopOfDifferentChannel(details.guildId, details.channelId)
        : jumpToTopOfCurrentChannel;
}

// https://docs.discord.food/resources/channel#channel-type
export enum ChannelType {
    GUILD_TEXT = 0,
    DM = 1,
    GUILD_VOICE = 2,
    GROUP_DM = 3,
    GUILD_CATEGORY = 4,
    GUILD_NEWS = 5,
    GUILD_STORE = 6,
    NEWS_THREAD = 10,
    PUBLIC_THREAD = 11,
    PRIVATE_THREAD = 12,
    GUILD_STAGE_VOICE = 13,
    GUILD_DIRECTORY = 14,
    GUILD_FORUM = 15,
    GUILD_MEDIA = 16,
    LOBBY = 17,
    EPHEMERAL_DM = 18,
}
