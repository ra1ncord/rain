import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { React, ReactNative } from "@metro/common";

import { betteryoubarSettings } from "../storage";
import { applyBannerLogic, createIconElement, getNotificationButtonHandlers, PatchOptions } from "./shared";

export function patchActual(ThemedYouBarModule: any, options: PatchOptions): (() => void)[] {
    if (!ThemedYouBarModule?.ThemedYouBar) return [];

    const patches: (() => void)[] = [];
    const { transitionToGuild, openUserSettings, IconButton } = options;

    const StarAsset = findAssetId("StarIcon");
    const SettingsAsset = findAssetId("SettingsIcon");
    const BellAsset = findAssetId("BellIcon");

    let npPatched = false;
    let fakeNameplate = false;

    patches.push(
        after("type", ThemedYouBarModule.ThemedYouBar, (_, res) => {
            const kids = res?.props?.children;
            if (!kids) return res;

            const nameplate = kids[1]?.type;
            if (nameplate && !npPatched) {
                npPatched = true;
                patches.push(
                    after("type", nameplate, (_args, npRes) => {
                        const rowKids = npRes?.props?.children;
                        if (!Array.isArray(rowKids)) return npRes;

                        const btnParentIndex = rowKids.findIndex((k: any) => {
                            if (!k?.props?.children) return false;
                            const children = Array.isArray(k.props.children) ? k.props.children : [k.props.children];
                            return children.some((child: any) => child?.props?.hasNameplate !== undefined || child?.type?.name === "YouBarNotificationsButton");
                        });
                        const youRowRightIndex = btnParentIndex !== -1 ? btnParentIndex : rowKids.length - 1;
                        const btnParent = rowKids[youRowRightIndex];

                        let npIndex = rowKids.findIndex((k: any) => {
                            if (!k?.props?.children) return false;
                            const children = Array.isArray(k.props.children) ? k.props.children : [k.props.children];
                            return children.some((child: any) => child?.props?.nameplate !== undefined);
                        });

                        if (npIndex === -1) {
                            npIndex = Math.max(1, youRowRightIndex - 2);
                        }

                        if (betteryoubarSettings.backgroundMode === "none") {
                            rowKids[npIndex] = null;
                        } else if (betteryoubarSettings.backgroundMode === "custom_image") {
                            if (!rowKids[npIndex]) {
                                const style = rowKids[0]?.props?.style;
                                const flatStyle = Array.isArray(style) ? style.flat(10) : [style];
                                const avatarSize = flatStyle.find((s: any) => s?.width >= 32 && s?.width <= 80)?.width || 60;

                                const rStyle = npRes.props?.style;
                                const flatRStyle = Array.isArray(rStyle) ? rStyle.flat(10) : [rStyle];
                                const barRadius = flatRStyle.find((s: any) => typeof s?.borderRadius === "number")?.borderRadius || 24;

                                rowKids[npIndex] = (
                                    <ReactNative.View
                                        key="custom-np"
                                        style={{ position: "absolute", top: 0, left: avatarSize, right: 0, bottom: 0, overflow: "hidden", borderTopRightRadius: barRadius, borderBottomRightRadius: barRadius }}
                                        pointerEvents="none"
                                    />
                                );
                            }

                            rowKids[npIndex] = applyBannerLogic(rowKids[npIndex]);
                            fakeNameplate = true;
                        } else {
                            if (rowKids[npIndex]) {
                                rowKids[npIndex] = applyBannerLogic(rowKids[npIndex]);
                            }
                        }

                        if (btnParent?.props?.children) {
                            const btnKids = Array.isArray(btnParent.props.children) ? [...btnParent.props.children] : [btnParent.props.children];
                            const validOriginalBtn = btnKids.find((k: any) => k && k.props);
                            const hasNp = validOriginalBtn?.props?.hasNameplate || fakeNameplate;

                            const mkIcon = (asset: any, onPress: any, onLongPress?: any) => (
                                <IconButton key={asset} size="sm" variant={hasNp ? "secondary-overlay" : "tertiary"} icon={createIconElement(asset, hasNp)} onPress={onPress} onLongPress={onLongPress} />
                            );

                            const originalBtnIndex = btnKids.findIndex((k: any) => k && k.props);

                            const { onPress, onLongPress } = getNotificationButtonHandlers();

                            if (originalBtnIndex !== -1) {
                                btnKids[originalBtnIndex] = mkIcon(BellAsset, onPress, onLongPress);
                            } else {
                                btnKids.push(mkIcon(BellAsset, onPress, onLongPress));
                            }

                            const cleanKids = btnKids.filter(Boolean);

                            if (betteryoubarSettings.showStar) cleanKids.unshift(mkIcon(StarAsset, () => transitionToGuild?.(betteryoubarSettings.targetServerId || "@favorites")));
                            if (betteryoubarSettings.showSettings) cleanKids.push(mkIcon(SettingsAsset, () => openUserSettings?.()));

                            btnParent.props.children = cleanKids;
                        }

                        return npRes;
                    })
                );
            }

            return res;
        })
    );

    return patches;
}
