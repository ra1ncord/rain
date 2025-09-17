import { findByStoreName } from "@metro";
import { after } from "spitroast";
import { definePlugin } from "@plugins/index";

const MaskedLink = findByStoreName("MaskedLinkStore");

export default definePlugin({
    manifest: {
        id: "alwaystrust",
        version: "1.0.0",
        display: {
            name: "AlwaysTrust",
            description: "Removes the popup before pressing an untrusted link",
        }
    },
    start() {
        alert(MaskedLink)
        after("isTrustedDomain", MaskedLink, () => {
            return true;
        })
    }
});