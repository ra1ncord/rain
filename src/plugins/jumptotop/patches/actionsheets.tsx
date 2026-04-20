import { findByName, findByProps } from "@metro";
import { after } from "@api/patcher";
import { findAssetId } from "@api/assets";
import { findInReactTree } from "@lib/utils";
import {
    ChannelType,
    jumpToTopOfDifferentChannel,
    jumpToTopOfForum,
} from "../utils";
import { jumpToTopSettings } from "../storage";
import { UpsideDown } from "../components/UpsideDown";
import { ActionSheetRow } from "@metro/common/components";

const ForumPostLongPressActionSheet = findByName(
    "ForumPostLongPressActionSheet",
    false,
);

const ChannelLongPressActionSheet = findByName(
    "ChannelLongPressActionSheet",
    false,
);

const SYM_PATCHED = Symbol.for("Patched by JumpToTop");

function findActionGroups(tree: any) {
    return findInReactTree(
        tree,
        (node) => node?.[0]?.type?.name === "ActionSheetRowGroup",
    );
}

function buildJumpToTopRow(onPress: () => void) {
    return (
        <ActionSheetRow.Group>
            <ActionSheetRow
                label="Jump To Top"
                icon={
                    <UpsideDown>
                        <ActionSheetRow.Icon
                            source={findAssetId("ArrowLargeDownIcon")}
                        />
                    </UpsideDown>
                }
                onPress={onPress}
            />
        </ActionSheetRow.Group>
    );
}

const allowedChannelTypes = [
    ChannelType.GUILD_TEXT,
    ChannelType.DM,
    ChannelType.GUILD_VOICE,
    ChannelType.GROUP_DM,
    ChannelType.GUILD_NEWS,
    ChannelType.GUILD_STORE,
    ChannelType.NEWS_THREAD,
    ChannelType.PUBLIC_THREAD,
    ChannelType.PRIVATE_THREAD,
];

export function patchActionSheets() {
    const patches: (() => void)[] = [];

    patches.push(
        after("default", ForumPostLongPressActionSheet, ([{ thread }], ret) => {
            if (!jumpToTopSettings.actionSheets || ret[SYM_PATCHED]) return;

            const actions = findActionGroups(ret);
            if (!actions) return;

            actions.unshift(
                buildJumpToTopRow(() =>
                    jumpToTopOfForum(thread.guild_id, thread.id),
                ),
            );

            ret[SYM_PATCHED] = true;
        }),
    );

    patches.push(
        after("default", ChannelLongPressActionSheet, (_, ret) => {
            if (!jumpToTopSettings.actionSheets || ret?.[SYM_PATCHED]) return;

            const channel = ret?.props?.channel;
            if (!channel) return;

            if (!allowedChannelTypes.includes(channel.type)) return;

            patches.push(
                after("type", ret, (_, component) => {
                    const actions = findActionGroups(component);
                    if (!actions) return;

                    actions.unshift(
                        buildJumpToTopRow(() =>
                            jumpToTopOfDifferentChannel(
                                channel.guild_id ?? "@me",
                                channel.id,
                            ),
                        ),
                    );
                }),
            );

            ret[SYM_PATCHED] = true;
        }),
    );

    return () => {
        for (const unpatch of patches) unpatch();
    };
}
