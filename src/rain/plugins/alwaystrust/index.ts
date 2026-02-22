import { after } from "@api/patcher";
import { findByStoreName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

const MaskedLink = findByStoreName("MaskedLinkStore");
const patches: (() => boolean)[] = [];

export default definePlugin({
    name: "AlwaysTrust",
    description: "Disable the untrusted link popup for every link",
    author: [Contributors.fres],
    id: "alwaystrust",
    version: "1.0.0",
    start() {
        patches.push(
            after("isTrustedDomain", MaskedLink, () => {
                return true;
            }),
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
    }
});
