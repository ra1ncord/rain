import { after, before } from "@api/patcher";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps } from "@metro";
import { Strings } from "@rain/i18n";

function patchSheet(funcName: string, sheetModule: any, once: boolean) {
    const unpatch = after(funcName, sheetModule, (args: any[], res: any) => {
        const emojiNode = args[0]?.emojiNode;
        if (!emojiNode?.src || !emojiNode?.id) return;

        if (!emojiNode.alt.endsWith("_rainenhancements")) return;

        const view = res?.props?.children?.props?.children;
        if (!view) return;
        after("type", view, (_: any, component: any) => {
            findInReactTree(component, (c: any) => {
                if (typeof c.props.children !== "string") return false;
                if (c.props.variant === "text-md/bold" && c.props.children.includes("_rainenhancements")) {
                    c.props.children = c.props.children.replace("_rainenhancements", ""); // typescript ragebait
                } else if (c.props.variant === "text-sm/medium" && !c.props.children.includes("RainEnhancements")) {
                    c.props.children += ` ${Strings.PLUGINS.CORE.RAINENHANCEMENTS.REALMOJI_RENDER}`;
                }
                return false;
            });
        });
        if (once) {
            unpatch();
        }
    });
    return unpatch;
}

export default function patchEmojiActionSheet() {
    const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
    if (!LazyActionSheet) return () => {};
    const patches: Array<() => void> = [];
    const unpatchLazy = before("openLazy", LazyActionSheet, ([lazySheet, name]) => {
        if (!["MessageEmojiActionSheet", "MessageCustomEmojiActionSheet"].includes(name)) return;
        unpatchLazy();
        lazySheet.then((module: any) => {
            patches.push(after("default", module, (_: any, res: any) => {
                patches.push(patchSheet("type", res, true));
            }));
        });
    });
    return () => {
        unpatchLazy();
        patches.forEach((p: () => void) => p?.());
    };
}
