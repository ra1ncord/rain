import { after } from "@api/patcher";
import { findByStoreName } from "@metro";
import { definePlugin } from "@plugins";

const MaskedLink = findByStoreName("MaskedLinkStore");
let patches: (() => boolean)[] = [];

export default definePlugin({
    name: "AlwaysTrust",
    description: "Disable the untrusted link popup for every link",
    author: [{ name: "fres", id: 843448897737064448n }],
    id: "alwaystrust",
    version: "v1.0.0",
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