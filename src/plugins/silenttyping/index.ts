import { instead } from "@api/patcher";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";
import { Strings } from "@rain/i18n";

const Typing = findByProps("startTyping", "stopTyping");
const patches: (() => void)[] = [];

export default definePlugin({
    name: Strings.PLUGINS.CUSTOM.SILENTTYPING.NAME,
    description: Strings.PLUGINS.CUSTOM.SILENTTYPING.DESCRIPTION,
    author: [Contributors.redstonekasi],
    id: "silenttyping",
    version: "1.0.0",
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
