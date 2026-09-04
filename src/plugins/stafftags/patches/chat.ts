import { after } from "@api/patcher";
import { findByName } from "@metro";
import { ReactNative } from "@metro/common";
import { ChannelStore, GuildStore } from "@metro/common/stores";
import chroma from "chroma-js";

import getTag, { getBuiltInTags } from "../lib/getTag";

const getTagProperties = findByName("getTagProperties", false);

export default () => after("default", getTagProperties, ([{ message }], ret) => {
    if (!getBuiltInTags().includes(ret.tagText)) {
        const channel = ChannelStore.getChannel(message.channel_id);
        const guild = GuildStore.getGuild(channel?.guild_id);

        const tag = getTag(guild, channel, message.author);

        if (tag) {
            return {
                ...ret,
                tagText: tag.text,
                tagTextColor: tag.textColor ? ReactNative.processColor(chroma(tag.textColor).hex()) : undefined,
                tagBackgroundColor: tag.backgroundColor ? ReactNative.processColor(chroma(tag.backgroundColor).hex()) : undefined,
                tagVerified: tag.verified,
                tagType: undefined
            };
        }
    }
});
