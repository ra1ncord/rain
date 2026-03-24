import { after } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

const AccountDispatcher = findByProps("getCanUseMultiAccountMobile");
const MultiAccountStore = findByStoreName("MultiAccountStore");
const patches: (() => boolean)[] = [];

export default definePlugin({
    name: "AccountSwitcher",
    description: Strings.PLUGINS.CUSTOM.ACCOUNTSWITCHER.DESCRIPTION,
    author: [Developers.John, Developers.cocobo1],
    id: "accountswitcher",
    version: "1.1.0",
    start() {
        patches.push(
            after("getCanUseMultiAccountMobile", AccountDispatcher, () => {
                return true;
            }),
        );

        Object.defineProperty(MultiAccountStore, "canUseMultiAccountNotifications", {
            get: () => true,
            configurable: true,
        });
    },
    stop() {
        for (const unpatch of patches) unpatch();
        delete (MultiAccountStore as any).canUseMultiAccountNotifications;
    }
});
