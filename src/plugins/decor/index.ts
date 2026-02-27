import { after, instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";
import { ReactNative } from "@metro/common";
import { definePlugin, isPluginEnabled } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import { CDN_URL, RAW_SKU_ID, SKU_ID } from "./lib/constants";
import { unsubscribe } from "./lib/stores/AuthorizationStore";
import { subscriptions as CurrentUserDecorationsStoreSubscriptions } from "./lib/stores/CurrentUserDecorationsStore";
import { subscriptions as UserDecorationsStoreSubscriptions, useUsersDecorationsStore } from "./lib/stores/UsersDecorationsStore";
import Settings from "./ui/pages/Settings";

const UserStore = findByStoreName("UserStore");
const ImageResolver = findByProps("getAvatarDecorationURL", "default");
const AvatarDecorationUtils = findByProps("isAnimatedAvatarDecoration");

const patches: any[] = [];

export default definePlugin({
    name: "Decor",
    description: "Create and use your own custom avatar decorations, or pick your favorite from the presets.",
    author: [Developers.Bwlok, Developers.cocobo1, Contributors.Fiery],
    id: "decor",
    version: "1.0.0",
    async eagerStart() {
        patches.push(unsubscribe);
        patches.push(...UserDecorationsStoreSubscriptions);
        patches.push(...CurrentUserDecorationsStoreSubscriptions);
        patches.push(
            after("getUser", UserStore, (_, user) => {
                // Only modify decorations if the plugin is enabled
                const isEnabled = isPluginEnabled("decor");
                if (!isEnabled) return;

                const store = useUsersDecorationsStore.getState();
                if (user && store.has(user.id)) {
                    const decoration = store.get(user.id);

                    if (decoration && user.avatarDecoration?.skuId !== SKU_ID) {
                        user.avatarDecoration = {
                            asset: decoration,
                            skuId: SKU_ID
                        };
                    } else if (!decoration && user.avatarDecoration && user.avatarDecoration?.skuId === SKU_ID) {
                        user.avatarDecoration = null;
                    }

                    user.avatarDecorationData = user.avatarDecoration;
                }
            })
        );

        patches.push(
            instead("getAvatarDecorationURL", ImageResolver, (args, orig) => {
                const [{ avatarDecoration, canAnimate }] = args;
                if (avatarDecoration?.skuId === SKU_ID) {
                    const parts = avatarDecoration.asset.split("_");
                    if (!canAnimate && parts[0] === "a") parts.shift();
                    return CDN_URL + `/${parts.join("_")}.png`;
                } else if (avatarDecoration?.skuId === RAW_SKU_ID) {
                    return avatarDecoration.asset;
                } else {
                    return orig(...args);
                }
            })
        );

        if (AvatarDecorationUtils) {
            patches.push(
                after("isAnimatedAvatarDecoration", AvatarDecorationUtils, ([avatarDecoration]) => {
                    if (ReactNative.Platform.OS === "ios" && avatarDecoration?.asset?.startsWith("file://")) return true;
                })
            );
        }

        useUsersDecorationsStore.getState().fetch(UserStore.getCurrentUser().id, true);
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: Settings,
});
