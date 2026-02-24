import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByName, findByProps, findByStoreName } from "@metro";

import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const DisplayName = findByName("DisplayName", false);
const HeaderName = findByName("HeaderName", false);

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;

const GuildStore = findByStoreName("GuildStore");
const ChannelStore = findByStoreName("ChannelStore");

export default () => {
    const patches: any[] = [];

    if (HeaderName) {
        patches.push(after("default", HeaderName, ([{ channelId }]: any, ret: any) => {
            ret.props.channelId = channelId;
        }));
    }

    if (DisplayName) {
        patches.push(after("default", DisplayName, ([{ guildId, channelId, user }]: any, ret: any) => {
            const tagComponent = findInReactTree(ret, (c: any) => c?.type?.Types);
            const labelText = getBotLabel?.(tagComponent?.props?.type);
            if (!tagComponent || (labelText && !BUILT_IN_TAGS.includes(labelText))) {
                const guild = GuildStore?.getGuild?.(guildId);
                const channel = ChannelStore?.getChannel?.(channelId);
                const tag = getTag(guild, channel, user);

                if (tag) {
                    if (tagComponent) {
                        tagComponent.props = {
                            type: 0,
                            ...tag
                        };
                    } else {
                        const row = findInReactTree(ret, (c: any) => c?.props?.style?.flexDirection === "row");
                        if (row?.props?.children) {
                            row.props.children.push(
                                <TagModule.default
                                    style={{ marginLeft: 0 }}
                                    type={0}
                                    text={tag.text}
                                    textColor={tag.textColor}
                                    backgroundColor={tag.backgroundColor}
                                    verified={tag.verified}
                                />
                            );
                        }
                    }
                }
            }
        }));
    }

    return () => patches.forEach((unpatch: any) => unpatch());
};
