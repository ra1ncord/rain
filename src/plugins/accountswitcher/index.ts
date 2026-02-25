import { after } from "@api/patcher";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const AccountDispatcher = findByProps("getCanUseMultiAccountMobile")
const patches: (() => boolean)[] = [];

export default definePlugin({
    name: "AccountSwitcher",
    description: "Enables account switcher because discord got rid of experiment",
    author: [Developers.John],
    id: "accountswitcher",
    version: "1.0.0",
    start() {
        patches.push(
            after("getCanUseMultiAccountMobile", AccountDispatcher, () => {
                return true;
            }),
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
    }
});
