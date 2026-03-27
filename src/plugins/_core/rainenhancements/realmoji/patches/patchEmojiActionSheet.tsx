import { after, before } from "@api/patcher";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps } from "@metro";

function patchSheet(funcName: string, sheetModule: any, once: boolean) {
    const unpatch = after(funcName, sheetModule, (args: any[], res: any) => {
        const emojiNode = args[0]?.emojiNode;
        if (!emojiNode?.src || !emojiNode?.id) return;

        if (!emojiNode.alt.endsWith("_rainenhancements") && !emojiNode.fake) return;
        emojiNode.fake = true;
        emojiNode.alt = emojiNode.alt.replace("_rainenhancements", "");

        const view = res?.props?.children?.props?.children;
        if (!view) return;
        after("type", view, (_: any, component: any) => {
            findInReactTree(component, (c: any) => {
                if (typeof c.props.children !== "string") return false;
                if (c.props.variant === "text-sm/medium" && !c.props.children.includes("RainEnhancements")) {
                    c.props.children += " This is a RainEnhancements emoji and renders like a real emoji only for you. Appears as a link to non-rain users.";
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
