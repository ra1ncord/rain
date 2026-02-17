import { findAssetId } from "@api/assets";
import { definePlugin } from "@plugins";
import { registerSection } from "@plugins/_core/settings";

export default definePlugin({
    name: "Asset Browser",
    description: "Browse Discord assets",
    author: [{ name: "kmmiio99o", id: 879393496627306587n }],
    id: "assetbrowser",
    version: "v1.0.0",
    start() {
        registerSection({
            name: "Rain",
            items: [{
                key: "RAIN_ASSET_BROWSER",
                title: () => "Asset Browser",
                icon: findAssetId("ImageIcon"),
                render: () => import("./AssetBrowser"),
            }],
        });
    },
});
