import { before, instead } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { clipboard, ReactNative } from "@metro/common";
import { Button } from "@metro/common/components";
import { GuildStore, UserSettingsProtoStore } from "@metro/common/stores";
import React from "react";

const { hideActionSheet } = findByProps("hideActionSheet");
const StickerUtils = findByProps("favoriteSticker", "unfavoriteSticker");
const { downloadMediaAsset } = findByProps("downloadMediaAsset");

function getStickerId(sticker: any): string | undefined {
    return sticker?.id ?? sticker?.sticker?.id ?? sticker?.renderableSticker?.id;
}

export function patchStickerActionSheet() {
    const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
    if (!LazyActionSheet) return () => {};

    const patches: Array<() => void> = [];
    let patched = false;

    const unpatchLazy = before("openLazy", LazyActionSheet, ([lazySheet, name]: [any, string]) => {
        if (typeof name !== "string" || !name.includes("StickerDetailActionSheet")) return;

        lazySheet.then((module: any) => {
            if (patched) return;

            const memo = module?.default;
            if (!memo) return;

            patched = true;
            patches.push(instead("type", memo, (componentArgs: any[], original: any) => {
                const res = original(...componentArgs);

                const props = componentArgs?.[0] ?? {};
                const sticker = props.sticker ?? props.renderableSticker?.sticker ?? props.renderableSticker;
                const stickerId = getStickerId(sticker);
                if (!stickerId) return res;

                const view = res?.props?.children;
                const content = view?.props?.children;
                if (!content) return res;

                const url = `https://discord.com/stickers/${stickerId}.png`;
                const favoritedStickers = UserSettingsProtoStore.frecencyWithoutFetchingLatest?.favoriteStickers?.stickerIds as Array<string> | undefined;
                const isFavorited = !!favoritedStickers?.find((s: string) => s === stickerId);
                const settings = require("./storage").useExpressionUtilsSettings.getState();

                const isInStickerGuild = sticker.guild_id ? GuildStore.getGuild(sticker.guild_id) !== undefined : true;

                const buttons = [
                    settings.showFavoriteButton && isInStickerGuild && {
                        key: "togglefavoritesticker", text: isFavorited ? "Remove from Favorites" : "Add to Favorites", onPress: () => {
                            isFavorited ? StickerUtils.unfavoriteSticker(stickerId) : StickerUtils.favoriteSticker(stickerId);
                            isFavorited ? showToast("Removed from favorites!") : showToast("Added to favorites!");
                            hideActionSheet();
                        }
                    },
                    settings.showDownloadButton && {
                        key: "savesticker", text: `Save image to ${ReactNative.Platform ? ReactNative.Platform.select({ android: "Downloads", default: "Camera Roll" }) : "Downloads"}`,
                        onPress: () => {
                            downloadMediaAsset(url, 0);
                            hideActionSheet();
                        }
                    },
                    settings.showCopyURLButton && {
                        key: "copystickerurl", text: "Copy Sticker URL", onPress: () => {
                            clipboard.setString(url);
                            showToast("Copied sticker URL!");
                            hideActionSheet();
                        }
                    },
                    settings.showCopyMarkdownButton && {
                        key: "copystickermarkdown", text: "Copy Markdown", onPress: () => {
                            const markdown = `<:sticker:${stickerId}>`;
                            clipboard.setString(markdown);
                            showToast("Copied sticker markdown!");
                            hideActionSheet();
                        }
                    }
                ].filter(Boolean);

                const children = React.Children.toArray(content).slice();
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
            }));
        });
    });

    return () => {
        unpatchLazy();
        patches.forEach((p: () => void) => p?.());
    };
}