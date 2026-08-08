import { findAssetId } from "@api/assets";
import { after, before } from "@api/patcher";
import { resolveSemanticColor, semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";

import { betteryoubarSettings } from "../storage";
import { createIconElement, FadeOverlay, getNotificationButtonHandlers, PatchOptions } from "./shared";

const { Image, View } = ReactNative;

export function patchFuture(
    YouBarBackground: any,
    YouBarNameplate: any,
    YouBarNotificationsButton: any,
    options: PatchOptions
): (() => void)[] {
    const patches: (() => void)[] = [];
    const { transitionToGuild, openUserSettings, IconButton } = options;

    const StarAsset = findAssetId("StarIcon");
    const SettingsAsset = findAssetId("SettingsIcon");
    const BellAsset = findAssetId("BellIcon");

    if (YouBarNameplate) { // this one will only work if and only if the user has an official nameplate
        patches.push(
            after("type", YouBarNameplate, (_args, res) => {
                const mode = betteryoubarSettings.backgroundMode;
                if (mode === "none" || mode === "custom_image") {
                    return null;
                }
                return res;
            })
        );
    }

    if (YouBarBackground) {
        patches.push(
            before("type", YouBarBackground, args => {
                const mode = betteryoubarSettings.backgroundMode;
                if (mode === "none" || mode === "custom_image") {
                    if (args[0]) {
                        args[0].hasNameplate = false;
                    }
                }
            })
        );

        patches.push(
            after("type", YouBarBackground, (args, res) => {
                const mode = betteryoubarSettings.backgroundMode;
                const url = betteryoubarSettings.customImageUrl;

                if (mode === "custom_image" && url && url.trim() !== "") {
                    const { avatarSize } = args[0] || {};
                    const leftOffset = avatarSize ?? 60;
                    const bgColor = resolveSemanticColor(
                        semanticColors.MOBILE_FLOATINGBAR_BACKGROUND ??
                        semanticColors.MOBILE_FLOATINGBAR_BACKGROUND_NAMEPLATE ??
                        semanticColors.BACKGROUND_TERTIARY
                    );

                    return (
                        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
                            {res}
                            <View
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: leftOffset,
                                    right: 0,
                                    bottom: 0,
                                    overflow: "hidden",
                                    borderTopRightRadius: 24,
                                    borderBottomRightRadius: 24,
                                }}
                                pointerEvents="none"
                            >
                                <Image
                                    source={{ uri: url.trim() }}
                                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
                                    resizeMode="cover"
                                />
                                <FadeOverlay color={bgColor} />
                            </View>
                        </View>
                    );
                }

                return res;
            })
        );
    }

    if (YouBarNotificationsButton) {
        patches.push(
            after("type", YouBarNotificationsButton, args => {
                const mode = betteryoubarSettings.backgroundMode;
                const isCustom = mode === "custom_image";
                const isNone = mode === "none";
                const hasNameplate = isNone ? false : (isCustom || args[0]?.hasNameplate);

                const { onPress, onLongPress } = getNotificationButtonHandlers();

                const mkIcon = (asset: any, onPress: any, onLongPress?: any) => (
                    <IconButton
                        key={asset}
                        size="sm"
                        variant={hasNameplate ? "secondary-overlay" : "tertiary"}
                        icon={createIconElement(asset, hasNameplate)}
                        onPress={onPress}
                        onLongPress={onLongPress}
                    />
                );

                return (
                    <React.Fragment>
                        {betteryoubarSettings.showStar && mkIcon(StarAsset, () => {
                            if (transitionToGuild) transitionToGuild(betteryoubarSettings.targetServerId || "@favorites");
                        })}
                        {mkIcon(BellAsset, onPress, onLongPress)}
                        {betteryoubarSettings.showSettings && mkIcon(SettingsAsset, () => {
                            if (openUserSettings) openUserSettings();
                        })}
                    </React.Fragment>
                );
            })
        );
    }

    return patches;
}
