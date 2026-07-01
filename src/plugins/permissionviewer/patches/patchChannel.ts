import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { showSheet } from "@api/ui/sheets";
import { findInReactTree } from "@lib/utils";
import { findByName } from "@metro";
import { React } from "@metro/common";
import { ActionSheetRow } from "@metro/common/components";

import ChannelPermsView from "../components/ChannelPermissionPage";

const ChannelLongPressActionSheet = findByName("ChannelLongPressActionSheet", false);
const SYM_PATCHED = Symbol("Patched by PermissionViewer");

function findActionGroups(tree: any) {
    return findInReactTree(
        tree,
        (node: any) => node?.[0]?.type?.name === "ActionSheetRowGroup",
    );
}

export default () => {
    if (!ChannelLongPressActionSheet) return () => {};
    const unpatches: (() => void)[] = [];

    const unpatch = after("default", ChannelLongPressActionSheet, (_, ret) => {
        if (ret?.[SYM_PATCHED]) return;

        const channel = ret?.props?.channel;
        if (!channel || !channel.guild_id) return;

        const innerUnpatch = after("type", ret, (_, component) => {
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

        unpatches.push(innerUnpatch);
        ret[SYM_PATCHED] = true;
    });

    unpatches.push(unpatch);
    return () => { for (const fn of unpatches) fn(); };
};
