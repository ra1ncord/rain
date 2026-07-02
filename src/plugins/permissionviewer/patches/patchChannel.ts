import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { showSheet } from "@api/ui/sheets";
import { findInReactTree } from "@lib/utils";
import { findByName } from "@metro";
import { React } from "@metro/common";
import { ActionSheetRow } from "@metro/common/components";

import ChannelPermsView from "../components/ChannelPermissionPage";

const ChannelLongPressActionSheet = findByName("ChannelLongPressActionSheet", false);

function findActionGroups(tree: any) {
    return findInReactTree(
        tree,
        (node: any) => node?.[0]?.type?.name === "ActionSheetRowGroup",
    );
}

export default () => {
    if (!ChannelLongPressActionSheet) return () => {};

    let innerUnpatch: (() => void) | null = null;

    const outerUnpatch = after("default", ChannelLongPressActionSheet, (_, ret) => {
        const channel = ret?.props?.channel;
        if (!channel || !channel.guild_id) return;

        if (innerUnpatch) innerUnpatch();

        innerUnpatch = after("type", ret, (_, component) => {
            const actions = findActionGroups(component);
            if (!actions) return;

            actions.push(
                React.createElement(ActionSheetRow.Group, { key: "permviewer-channel" },
                    React.createElement(ActionSheetRow, {
                        label: "Channel Permissions",
                        icon: React.createElement(ActionSheetRow.Icon, { source: findAssetId("ShieldIcon") }),
                        onPress: () => {
                            showSheet("permissionviewer-channel-" + channel.id, ChannelPermsView, { channelId: channel.id });
                        },
                    }),
                ),
            );
        });
    });

    return () => {
        if (innerUnpatch) innerUnpatch();
        outerUnpatch();
    };
};
