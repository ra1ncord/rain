import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { React } from "@metro/common";

import { betteryoubarSettings } from "../storage";
import { applyBannerLogic, createIconElement, getNotificationButtonHandlers, PatchOptions } from "./shared";

export function patchFuture(YouBarNameplate: any, YouBarNotificationsButton: any, options: PatchOptions): (() => void)[] {
    const patches: (() => void)[] = [];
    const { transitionToGuild, openUserSettings, IconButton } = options;

    const StarAsset = findAssetId("StarIcon");
    const SettingsAsset = findAssetId("SettingsIcon");
    const BellAsset = findAssetId("BellIcon");

    if (YouBarNameplate) {
        patches.push(
            after("type", YouBarNameplate, (_args, res) => {
                return applyBannerLogic(res);
            })
        );
    }

    if (YouBarNotificationsButton) {
        patches.push(
            after("type", YouBarNotificationsButton, args => {
                const hasNameplate = args[0]?.hasNameplate;

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
