import { after } from "@api/patcher";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";

const { View } = findByProps("View", "Text");
const patches: (() => void)[] = [];

export default definePlugin({
    name: "Dashless",
    description: "Changes dashes in text channel names to spaces",
    author: [{ name: "Awesomegamergame", id: 504401951623086081n }],
    id: "dashless",
    version: "1.0.0",

    start() {
        patches.push(
            after("render", View.prototype || View, (_, res) => {
                return traverseAndModify(res);
            })
        );
    },

    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
});

const traverseAndModify = (node: any): any => {
    if (typeof node === "string") {
        return node.replace(/-/g, " ");
    }

    if (Array.isArray(node)) {
        return node.map(traverseAndModify);
    }

    if (node?.props?.children) {
        return {
            ...node,
            props: {
                ...node.props,
                children: traverseAndModify(node.props.children),
            },
        };
    }

    return node;
};
