import { after, instead } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findByProps, findByStoreName } from "@metro";
import { clipboard, ReactNative } from "@metro/common";
import { Button } from "@metro/common/components";
import React from "react";

const { hideActionSheet } = findByProps("hideActionSheet");
const UserSettingsProtoStore = findByStoreName("UserSettingsProtoStore");
const GuildStore = findByStoreName("GuildStore");
const StickerUtils = findByProps("favoriteSticker", "unfavoriteSticker");
const { downloadMediaAsset } = findByProps("downloadMediaAsset");
const LazyActionSheet = findByProps("hideActionSheet");

export function patchStickerActionSheet() {
    let patched = false;
    return after("openLazy", LazyActionSheet, (args, res) => {
        const lazyRecord = args?.[0]?._j?.default;
        if (!lazyRecord) return;
        if (lazyRecord.type?.name !== "StickerDetailActionSheet") return;
        if (patched) return;
        patched = true;
        instead("type", lazyRecord, (componentArgs, original) => {
            const res = original(...componentArgs);
            const view = res?.props?.children;
            if (!view?.props?.children.props?.sticker) {
                return res;
            }
            const sticker = view?.props?.children?.props?.sticker;
            const children = React.Children.toArray(view.props.children);
            const url = `https://discord.com/stickers/${sticker.id}.png`;
            const favoritedStickers = UserSettingsProtoStore.frecencyWithoutFetchingLatest?.favoriteStickers?.stickerIds as Array<string>;
            const isFavorited = !!favoritedStickers?.find((s: string) => s === sticker.id);
            const settings = require("./storage").useExpressionUtilsSettings.getState();

            // Check if user is in the guild that owns this sticker
            const isInStickerGuild = sticker.guild_id ? GuildStore.getGuild(sticker.guild_id) !== undefined : true;

            const buttons = [
                // Favorites toggle first (only if enabled and user is in the guild)
                settings.showFavoriteButton && isInStickerGuild && {
                    key: "togglefavoritesticker", text: isFavorited ? "Remove from Favorites" : "Add to Favorites", onPress: () => {
                        isFavorited ? StickerUtils.unfavoriteSticker(sticker.id) : StickerUtils.favoriteSticker(sticker.id);
                        isFavorited ? showToast("Removed from favorites!") : showToast("Added to favorites!");
                        hideActionSheet();
                    }
                },
                // Download
                settings.showDownloadButton && {
                    key: "savesticker", text: `Save image to ${ReactNative.Platform ? ReactNative.Platform.select({ android: "Downloads", default: "Camera Roll" }) : "Downloads"}`,
                    onPress: () => {
                        downloadMediaAsset(url, 0);
                        hideActionSheet();
                    }
                },
                // Copy URL
                settings.showCopyURLButton && {
                    key: "copystickerurl", text: "Copy Sticker URL", onPress: () => {
                        clipboard.setString(url);
                        showToast("Copied sticker URL!");
                        hideActionSheet();
                    }
                },
                // Copy Markdown
                settings.showCopyMarkdownButton && {
                    key: "copystickermarkdown", text: "Copy Markdown", onPress: () => {
                        const markdown = `<:sticker:${sticker.id}>`;
                        clipboard.setString(markdown);
                        showToast("Copied sticker markdown!");
                        hideActionSheet();
                    }
                }
            ].filter(Boolean);
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
    });
}
