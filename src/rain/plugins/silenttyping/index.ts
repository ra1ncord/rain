import { definePlugin } from "@plugins";
import { instead } from "@api/patcher";
import { findByProps } from "@metro/wrappers";

const Typing = findByProps("startTyping", "stopTyping");
const patches: (() => void)[] = [];

export default definePlugin({
    name: "SilentTyping",
    description: "Hides your typing status from others",
    author: [{ name: "redstonekasi", id: 265064055490871297n }],
    id: "silenttyping",
    version: "v1.0.0",
    start() {
        patches.push(
            instead("startTyping", Typing, () => {}),
            instead("stopTyping", Typing, () => {})
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
});