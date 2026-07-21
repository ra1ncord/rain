import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { findByProps, findByTypeName } from "@metro";
import { React, ReactNative } from "@metro/common";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import Settings from "./Settings";
import { coolBarSettings } from "./storage";

const { Image, View } = ReactNative;
let patches: (() => void)[] = [];

export default definePlugin({
    name: "CoolBar",
    description: "Adds buttons next to the notifications button to open favorites and settings.",
    id: "coolbar",
    version: "1.1.0",
    author: [Developers.j],
    settings: Settings,
    start() {
        const { transitionToGuild } = findByProps("transitionToGuild") || {};
        const { openUserSettings } = findByProps("openUserSettings") || {};
        const YouBarNotificationsButton = findByTypeName("YouBarNotificationsButton");
        const { IconButton } = findByProps("IconButton") || {};

        if (YouBarNotificationsButton) { // this should always exist though
            patches.push(
                after("type", YouBarNotificationsButton, (args, res) => {
                    const hasNameplate = args[0]?.hasNameplate;
                    const StarAsset = findAssetId("StarIcon");
                    const SettingsAsset = findAssetId("SettingsIcon");

                    const starIconElement = (
                        <View style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <Image
                                source={StarAsset}
                                style={{ width: 16, height: 16, tintColor: hasNameplate ? "white" : undefined }}
                            />
                        </View>
                    );

                    const settingsIconElement = (
                        <View style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <Image
                                source={SettingsAsset}
                                style={{ width: 16, height: 16, tintColor: hasNameplate ? "white" : undefined }}
                            />
                        </View>
                    );

                    return (
                        <React.Fragment>
                            {coolBarSettings.showStar && (
                                <IconButton
                                    size="sm"
                                    variant={hasNameplate ? "secondary-overlay" : "tertiary"}
                                    icon={starIconElement}
                                    onPress={() => {
                                        if (transitionToGuild) {
                                            transitionToGuild(coolBarSettings.targetServerId || "@favorites");
                                        }
                                    }}
                                />
                            )}
                            {res}
                            {coolBarSettings.showSettings && (
                                <IconButton
                                    size="sm"
                                    variant={hasNameplate ? "secondary-overlay" : "tertiary"}
                                    icon={settingsIconElement}
                                    onPress={() => {
                                        if (openUserSettings) {
                                            openUserSettings();
                                        }
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })
            );
        }
    },
    stop() {
        for (const unpatch of patches) {
            unpatch();
        }
        patches = [];
    }
});
