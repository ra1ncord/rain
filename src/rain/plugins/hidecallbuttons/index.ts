import { definePlugin } from "@plugins";
import {
    hidecallbuttonsSettings,
    waitForHideCallButtonsSettingsHydration,
} from "./storage";
import { findAssetId } from "@api/assets";
import { metro } from "@lib";
import { cyrb64Hash } from "@lib/utils/cyrb64";
import { findByName, findByProps } from "@metro";
import { after, instead } from "@api/patcher";
import settings from "./settings";

let patches: (() => boolean)[] = [];
const find = (filter: (m: any) => boolean) => {
    return metro.findExports(
        metro.factories.createSimpleFilter(
            filter,
            cyrb64Hash(new Error().stack!),
        ),
    );
};

export default definePlugin({
    name: "HideCallButtons",
    description: "Hides call buttons from dms, user profiles and vcs",
    author: [{ name: "John", id: 780819226839220265n }],
    id: "hidecallbuttons",
    version: "v1.0.0",
    async start() {
        await waitForHideCallButtonsSettingsHydration();
        let videoCallAsset = findAssetId("ic_video");
        let voiceCallAsset = findAssetId("ic_audio");
        const videoAsset = findAssetId("video");
        const callAsset = findAssetId("nav_header_connect");
        const videoAsset2 = findAssetId("VideoIcon");
        const callAsset2 = findAssetId("PhoneCallIcon");

        if (videoCallAsset === undefined) videoCallAsset = videoAsset2;
        if (voiceCallAsset === undefined) voiceCallAsset = callAsset2;

        const UserProfileActions = findByName("UserProfileActions", false);
        let SimplifiedUserProfileContactButtons = findByName(
            "SimplifiedUserProfileContactButtons",
            false,
        );
        if (SimplifiedUserProfileContactButtons === undefined)
            SimplifiedUserProfileContactButtons = findByName(
                "UserProfileContactButtons",
                false,
            );
        const PrivateChannelButtons = find(
            (x) => x?.type?.name == "PrivateChannelButtons",
        );
        const VideoButton = findByName("VideoButton", false);
        // User Profile
        if (UserProfileActions !== undefined) {
            patches.push(
                after("default", UserProfileActions, (_, component) => {
                    if (
                        !hidecallbuttonsSettings.upHideVideoButton &&
                        !hidecallbuttonsSettings.upHideVoiceButton
                    )
                        return;

                    let buttons =
                        component?.props?.children?.props?.children[1]?.props
                            ?.children;
                    if (buttons === undefined)
                        buttons =
                            component?.props?.children[1]?.props?.children;
                    if (buttons?.props?.children !== undefined)
                        buttons = buttons?.props?.children;
                    if (buttons === undefined) return;

                    for (var idx in buttons) {
                        var button = buttons[idx];
                        if (button?.props?.children !== undefined) {
                            var buttonContainer = button?.props?.children;
                            for (var idx2 in buttonContainer) {
                                var btn = buttonContainer[idx2];
                                if (
                                    (btn?.props?.icon === voiceCallAsset &&
                                        hidecallbuttonsSettings.upHideVoiceButton) ||
                                    (btn?.props?.icon === videoCallAsset &&
                                        hidecallbuttonsSettings.upHideVideoButton)
                                )
                                    delete buttonContainer[idx2];
                            }
                        }
                        if (button?.props?.IconComponent !== undefined) {
                            if (hidecallbuttonsSettings.upHideVoiceButton)
                                delete buttons[1];
                            if (hidecallbuttonsSettings.upHideVideoButton)
                                delete buttons[2];
                        }
                        if (
                            (button?.props?.icon === voiceCallAsset &&
                                hidecallbuttonsSettings.upHideVoiceButton) ||
                            (button?.props?.icon === videoCallAsset &&
                                hidecallbuttonsSettings.upHideVideoButton)
                        )
                            delete buttons[idx];
                    }
                }),
            );
        }
        // Simplified user profile
        patches.push(
            after(
                "default",
                SimplifiedUserProfileContactButtons,
                (_, component) => {
                    let buttons = component?.props?.children;
                    if (buttons === undefined) return;

                    if (hidecallbuttonsSettings.upHideVoiceButton)
                        delete buttons[1];

                    if (hidecallbuttonsSettings.upHideVideoButton)
                        delete buttons[2];
                },
            ),
        );

        // VC
        patches.push(
            instead("default", VideoButton, (args, orig) => {
                if (hidecallbuttonsSettings.hideVCVideoButton) return;

                return orig.apply(this, args);
            }),
        );

        // Tabs V2 DM Header
        patches.push(
            after("type", PrivateChannelButtons, (_, component) => {
                if (
                    !hidecallbuttonsSettings.dmHideCallButton &&
                    !hidecallbuttonsSettings.dmHideVideoButton
                )
                    return;

                let buttons = component?.props?.children;
                if (buttons === undefined) return;

                if (buttons[0]?.props?.accessibilityLabel !== undefined) {
                    if (hidecallbuttonsSettings.dmHideCallButton)
                        delete buttons[0];
                    if (hidecallbuttonsSettings.dmHideVideoButton)
                        delete buttons[1];

                    return;
                }
                if (buttons[0]?.props?.source === undefined)
                    buttons = buttons[0]?.props?.children;

                if (buttons === undefined) return;

                for (var idx in buttons) {
                    var button = buttons[idx];
                    if (
                        (button?.props?.source === callAsset &&
                            hidecallbuttonsSettings.dmHideCallButton) ||
                        (button?.props?.source === videoAsset &&
                            hidecallbuttonsSettings.dmHideVideoButton) ||
                        (button?.props?.source === callAsset2 &&
                            hidecallbuttonsSettings.dmHideCallButton) ||
                        (button?.props?.source === videoAsset2 &&
                            hidecallbuttonsSettings.dmHideVideoButton)
                    )
                        delete buttons[idx];
                }
            }),
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
    settings: settings,
});
