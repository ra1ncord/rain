import { after,before } from "@api/patcher";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps } from "@metro";

function patchSheet(funcName: string, sheetModule: any, once: boolean) {
    const unpatch = after(funcName, sheetModule, (args: any[], res: any) => {
        const emojiNode = args[0]?.emojiNode;
        if (!emojiNode?.src) return;
        const view = res?.props?.children?.props?.children;
        if (!view) return;
        const unpatchView = after("type", view, (_: any, component: any) => {
            const isButton = (c: any) => c?.type?.name === "Button";
            const isGetNitro = (c: any) =>
                (typeof c?.props?.text === "string" && c.props.text.toLowerCase().includes("nitro")) ||
                (typeof c?.props?.children === "string" && c.props.children.toLowerCase().includes("nitro"));
            const buttonsContainer = findInReactTree(component, (c: any) => Array.isArray(c) && c.some(isButton));
            if (buttonsContainer) {
                // Remove Get Nitro button(s)
                for (let i = buttonsContainer.length - 1; i >= 0; i--) {
                    if (isGetNitro(buttonsContainer[i])) {
                        buttonsContainer.splice(i, 1);
                    }
                }
            } else if (component?.props?.children?.push) {
                // Remove Get Nitro button if present in children
                if (Array.isArray(component.props.children)) {
                    for (let i = component.props.children.length - 1; i >= 0; i--) {
                        if (isGetNitro(component.props.children[i])) {
                            component.props.children.splice(i, 1);
                        }
                    }
                }
            }
        });
        if (once) {
            unpatch();
        }
    });
    return unpatch;
}

export default function getPatches() {
    return [
        (() => {
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
        })()
    ];
}
