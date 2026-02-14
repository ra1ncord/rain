import { after } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { definePlugin } from "@plugins";
import { ActionSheet, ActionSheetRow } from "@metro/common/components";
import { showConfirmationAlert } from "@api/ui/alerts";
import { findInReactTree } from "@lib/utils";
import { findByProps } from "@metro";
import { ReactElement } from "react";

const patches: (() => void)[] = [];
const APIUtils = findByProps("getAPIBaseURL", "del");

export default definePlugin({
    name: "BetterSilentLeave",
    description: "Adds a button to leave groups silently.",
    author: [{ name: "reyyan1", id: 797034673846747158n }],
    id: "silentleave",
    version: "v1.0.0",
    start() {
        patches.push(
            after("render", ActionSheet, (args, res) => {
                const dangerGroup: ReactElement<any> = findInReactTree(res, x => x?.props?.variant === "danger" || x?.key === "gdm-destructive");
                if (!dangerGroup) return res;

                const children: Array<any> = React.Children.toArray(dangerGroup.props.children);
                const leaveRow = dangerGroup.props.children.find((c: any) => c?.props?.variant === "danger");
                const leaveIcon = leaveRow?.props?.icon?.props?.IconComponent;

                const props = args[0];
                const channelId = props?.header?.props?.icon?.props?.channel?.id;

                children.push(
                    React.createElement(ActionSheetRow, {
                        label: "Leave Silently",
                        variant: "danger",
                        icon: React.createElement(ActionSheetRow.Icon, { IconComponent: leaveIcon }),
                        onPress: () => {
                            showConfirmationAlert({
                                title: "Leave Group",
                                content: "Are you sure you want to leave this group silently?",
                                confirmText: "Leave Silently",
                                confirmColor: "red",
                                onConfirm: () => {
                                    if (!channelId) return;
                                    try {
                                        APIUtils.del({
                                            url: `/channels/${channelId}`,
                                            query: "silent=true"
                                        });
                                        showToast("Left silently");
                                    } catch {
                                        showToast("Failed to leave silently");
                                    }

                                },
                                cancelText: "Cancel",
                                onCancel: () => {
                                },
                            },
                            );
                        }
                    })
                );

                const clonedGroup = React.cloneElement(dangerGroup, {}, children);
                const sheetChildren = React.Children.map(res.props.children, child =>
                    child === dangerGroup ? clonedGroup : child
                );

                return React.cloneElement(res, {}, sheetChildren);
            })
        );

    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});