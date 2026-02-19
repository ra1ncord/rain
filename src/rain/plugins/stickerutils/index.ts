import { after, instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";
import { Button } from "@metro/common/components";
import { clipboard } from "@metro/common";
import { showToast } from "@api/ui/toasts";
import { definePlugin } from "@plugins";
import React from "react";

const { hideActionSheet } = findByProps("hideActionSheet");
const UserSettingsProtoStore = findByStoreName("UserSettingsProtoStore");
const StickerUtils = findByProps("favoriteSticker", "unfavoriteSticker");
const { downloadMediaAsset } = findByProps("downloadMediaAsset");
const LazyActionSheet = findByProps("hideActionSheet");

// nuclear war field ahead

const patches: (() => void)[] = [];
let patched = false;

export default definePlugin({
    name: "StickerUtils",
    description: "i love discord!",
    author: [ {
            name: "sapphire",
            id: 757982547861962752n
        },
        { 
            name: "reyyan1", 
            id: 797034673846747158n 
        }
    ],
    id: "stickerutils",
    version: "v1.0.0",
    start() {
        patches.push(
            after("openLazy", LazyActionSheet, (args, res) => {
                // If a sticker actionsheet were to be opened then this would log a component
                // with type name StickerDetailActionSheet which is what is needed to patch
                const lazyRecord = args?.[0]?._j?.default;
                if (!lazyRecord) return;

                // Checks the name and if it isnt the sticker sheet then returns
                if (lazyRecord.type?.name !== "StickerDetailActionSheet") return;

                // Prevents from patching multiple times
                if (patched) return;
                patched = true;

                instead("type", lazyRecord, (componentArgs, original) => {
                    // This the ACTUAL component to patch 
                    const res = original(...componentArgs);

                    // This has 3 stages of rendering so this ignores the first 2
                    const view = res?.props?.children;
                    if (!view?.props?.children.props?.sticker) {
                        return res;
                    }

                    // Props of the sticker itself
                    const sticker = view?.props?.children?.props?.sticker;
                    const children = React.Children.toArray(view.props.children);

                    const url = `https://discord.com/stickers/${sticker.id}.png`;
                    const favoritedStickers = UserSettingsProtoStore.frecencyWithoutFetchingLatest?.favoriteStickers?.stickerIds as Array<string>;
                    const isFavorited = !!favoritedStickers?.find((s: string) => s === sticker.id);


                    // I made this an array cause i dont wanna copy paste like 4 buttons
                    // I couldve done that but i just decided im gonna make it harder for myself
                    const buttons = [
                        {
                            key: "copystickerid", text: "Copy Sticker ID", onPress: () => {
                                clipboard.setString(sticker.id);
                                showToast("Copied sticker ID!");
                                hideActionSheet();
                            }
                        },
                        {
                            key: "copystickerurl", text: "Copy Sticker URL", onPress: () => {
                                clipboard.setString(url);
                                showToast("Copied sticker URL!");
                                hideActionSheet();
                            }
                        },
                        {
                            key: "savesticker", text: "Save Sticker", onPress: () => {
                                downloadMediaAsset(url, 0);
                                hideActionSheet();

                            }
                        },
                        {
                            key: "togglefavoritesticker", text: isFavorited ? "Remove from Favorites" : "Add to Favorites", onPress: () => {
                                isFavorited ? StickerUtils.unfavoriteSticker(sticker.id) : StickerUtils.favoriteSticker(sticker.id);
                                isFavorited ? showToast("Removed from favorites!") : showToast("Added to favorites!");
                                hideActionSheet();
                            }
                        },


                    ];

                    buttons.forEach(btn => {
                        if (!children.some(c => React.isValidElement(c) && c?.key === btn.key)) {
                            children.push(
                                React.createElement(Button, {
                                    key: btn.key,
                                    text: btn.text,
                                    onPress: btn.onPress,
                                    style: { marginTop: 8 }
                                })
                            );
                        }
                    });

                    const newView = React.cloneElement(view, { children });
                    return React.cloneElement(res, { children: newView });
                });

            })
        );
    },
    stop() {
        for (const patch of patches) patch();
    }
});