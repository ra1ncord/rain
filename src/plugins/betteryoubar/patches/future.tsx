import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { React } from "@metro/common";

import { betteryoubarSettings } from "../storage";
import { applyBannerLogic, createIconElement, PatchOptions } from "./shared";

export function patchFuture(YouBarNameplate: any, YouBarNotificationsButton: any, options: PatchOptions): (() => void)[] {
    const patches: (() => void)[] = [];
    const { transitionToGuild, openUserSettings, IconButton } = options;

    const StarAsset = findAssetId("StarIcon");
    const SettingsAsset = findAssetId("SettingsIcon");

    if (YouBarNameplate) {
        patches.push(
            after("type", YouBarNameplate, (_args, res) => {
                return applyBannerLogic(res);
            })
        );
    }

    if (YouBarNotificationsButton) {
        patches.push(
            after("type", YouBarNotificationsButton, (args, res) => {
                const hasNameplate = args[0]?.hasNameplate;

                return (
                    <React.Fragment>
                        {betteryoubarSettings.showStar && (
                            <IconButton
                                size="sm"
                                variant={hasNameplate ? "secondary-overlay" : "tertiary"}
                                icon={createIconElement(StarAsset, hasNameplate)}
                                onPress={() => {
                                    if (transitionToGuild) transitionToGuild(betteryoubarSettings.targetServerId || "@favorites");
                                }}
                            />
                        )}
                        {res}
                        {betteryoubarSettings.showSettings && (
                            <IconButton
                                size="sm"
                                variant={hasNameplate ? "secondary-overlay" : "tertiary"}
                                icon={createIconElement(SettingsAsset, hasNameplate)}
                                onPress={() => {
                                    if (openUserSettings) openUserSettings();
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })
        );
    }

    return patches;
}
