import { after } from "@api/patcher";
import { componentTarget } from "@api/react/componentTarget";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { findInReactTree } from "@lib/utils";
import { findByProps } from "@metro";
import { React } from "@metro/common";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

let teardown: (() => void) | undefined;

// Clone the path to the group, including any native layout wrappers.
function replaceGroup(tree: any, group: any, replacement: any, depth = 0): any {
    if (tree === group) return replacement;
    if (depth > 24) return tree;
    if (Array.isArray(tree)) return tree.map(child => replaceGroup(child, group, replacement, depth + 1));
    if (!React.isValidElement(tree) || !(tree as any).props?.children) return tree;
    return React.cloneElement(tree as any, {}, React.Children.map((tree as any).props.children,
        child => replaceGroup(child, group, replacement, depth + 1)));
}

export default definePlugin({
    name: "SilentLeave",
    description: "Adds a confirmation button to leave group DMs silently.",
    author: [Developers.reyyan1],
    id: "silentleave",
    version: "1.1.0",
    start() {
        if (teardown) return;
        const sheets = findByProps("ActionSheet");
        const target = componentTarget(sheets, "ActionSheet");
        const api = findByProps("getAPIBaseURL", "del");
        if (!target || typeof api?.del !== "function")
            throw new Error("SilentLeave is unavailable for this Discord action sheet");
        let active = true;
        const pending = new Set<string>();
        const restore = after(target.key, target.parent, function(this: any, args: any[], tree: any) {
            if (!active) return;
            const group = findInReactTree(tree, x => x?.key === "gdm-destructive");
            if (!group?.props) return;
            const props = args[0] ?? this?.props;
            const channel = props?.channel ?? props?.header?.props?.icon?.props?.channel;
            if (!/^\d{17,20}$/.test(channel?.id ?? "") || channel.type != null && channel.type !== 3) return;
            const children: any[] = React.Children.toArray(group.props.children);
            if (children.some(row => row?.props?.rainSilentLeave)) return;
            const template = children.find(row => React.isValidElement(row) && row.props?.variant === "danger");
            if (!template) return;
            const channelId = channel.id;
            const onPress = () => {
                if (!active || pending.has(channelId)) return;
                showConfirmationAlert({
                    title: "Leave Group",
                    content: "Are you sure you want to leave this group silently?",
                    confirmText: "Leave Silently", confirmColor: "red", cancelText: "Cancel",
                    onCancel() {},
                    async onConfirm() {
                        if (!active || pending.has(channelId)) return;
                        pending.add(channelId);
                        try {
                            await api.del({ url: `/channels/${channelId}`, query: "silent=true" });
                            if (active) showToast("Left silently");
                        } catch {
                            if (active) showToast("Failed to leave silently");
                        } finally { pending.delete(channelId); }
                    }
                });
            };
            // Preserve the native row type/icon, but never copy its leave handler.
            children.push(React.createElement(template.type, {
                key: "rain-silent-leave", label: "Leave Silently", variant: "danger",
                icon: template.props.icon, rainSilentLeave: true, onPress,
            }));
            return replaceGroup(tree, group, React.cloneElement(group, {}, children));
        });
        teardown = () => { active = false; restore(); };
    },
    stop() { const remove = teardown; teardown = undefined; remove?.(); },
});
