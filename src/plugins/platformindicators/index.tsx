import { findAssetId } from "@api/assets";
import { after, before } from "@api/patcher";
import { waitForHydration } from "@api/storage";
import { findInReactTree } from "@lib/utils";
import { findByName,findByProps, findByTypeName, findByTypeNameAll } from "@metro";
import { ReactNative } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";
import PresenceUpdatedContainer from "./PresenceUpdatedContainer";
import Settings from "./settings";
import StatusIcons from "./StatusIcons";
import { platformIndicatorSettings,usePlatformIndicatorSettings } from "./storage";

const { View, Text } = ReactNative;

type Unpatch = () => void;

const unpatches: Unpatch[] = [];

export default definePlugin({
    name: "PlatformIndicators",
    description: Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.DESCRIPTION,
    author: [Contributors.MSMA, Developers.kmmiio99o],
    id: "platformindicators",
    version: "1.0.0",
    async start() {
        waitForHydration(usePlatformIndicatorSettings);

        const debugLabels = false;

        // tabs v2 dm header
        unpatches.push(after("default", findByName("ChannelHeader", false), (args, res) => {
            if (!platformIndicatorSettings.dmTopBar) return;
            if (!(res.type?.type?.name === "PrivateChannelHeader")) return;

            after("type", res.type, (args, res) => {
                if (!res.props?.children?.props?.children) return;
                const userId = findInReactTree(res, m => m.props?.user?.id)?.props?.user?.id;
                if (!userId) return;

                const dmTopBar = res.props?.children;
                if (!findInReactTree(res, m => m.key === "DMTabsV2Header")) {
                    if (dmTopBar.props?.children?.props?.children[1]) {
                        if (typeof dmTopBar.props?.children?.props?.children[1]?.type === "function") {
                            const titleThing = dmTopBar.props?.children?.props?.children[1];

                            const unpatchTV2HdrV2 = after("type", titleThing, (args, res) => {
                                unpatchTV2HdrV2();
                                if (!findInReactTree(res, c => c.key === "DMTabsV2Header-v2")) {
                                    res.props.children[0].props.children.push(
                                        <PresenceUpdatedContainer key="DMTabsV2Header-v2">
                                            {debugLabels ? <Text>DTV2H-v2</Text> : <StatusIcons userId={userId} />}
                                        </PresenceUpdatedContainer>
                                    );
                                }
                            });
                        } else {
                            const arrowId = findAssetId("arrow-right");
                            const container1 = findInReactTree(dmTopBar, m => m.props?.children[1]?.props?.source === arrowId);

                            container1?.props?.children?.push(<View
                                key="DMTabsV2Header"
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    alignContent: "flex-start"
                                }}>
                                <View
                                    key="DMTabsV2HeaderIcons"
                                    style={{
                                        flexDirection: "row"
                                    }}></View>
                            </View>);
                        }
                    }
                }
                const topIcons = findInReactTree(res, m => m.key === "DMTabsV2HeaderIcons");
                if (topIcons) {
                    topIcons.props.children = <StatusIcons userId={userId} />;
                }
            });
        }));

        // User profile content
        const UserProfileContent = findByTypeName("UserProfileContent");

        unpatches.push(after("type", UserProfileContent, (args, res) => {
            const primaryInfo = findInReactTree(res, c => c?.type?.name === "PrimaryInfo");
            after("type", primaryInfo, (args, res) => {
                if (res?.type?.name === "UserProfilePrimaryInfo") {
                    after("type", res, (args, res) => {
                        const displayName = findInReactTree(res, c => c?.type?.name === "DisplayName");

                        after("type", displayName, (args, res) => {
                            const userId = args[0]?.user?.id;
                            if (userId) {
                                res.props.children.push(
                                    <PresenceUpdatedContainer key="UserProfileIcons">
                                        <StatusIcons userId={userId} />
                                    </PresenceUpdatedContainer>
                                );
                            }
                        });
                    });
                }
            });
        }));

        // DisplayName patch
        const DisplayName = findByProps("DisplayName");
        unpatches.push(after("DisplayName", DisplayName, (args, res) => {
            const user = args[0]?.user;
            if (user === undefined) return;
            if (!res) return;
            if (!user.id) return;
            if (!platformIndicatorSettings.profileUsername) return;
            res.props?.children?.props?.children[0]?.props?.children?.push(<StatusIcons userId={user.id} />);
        }));

        // Status patch
        const Status = findByName("Status", false);
        unpatches.push(before("default", Status, args => {
            if (!args) return;
            if (!args[0]) return;
            if (!platformIndicatorSettings.removeDefaultMobile) return;
            args[0].isMobileOnline = false;
        }));

        // Guild member row
        const Rows = findByProps("GuildMemberRow");
        if (Rows?.GuildMemberRow) {
            unpatches.push(after("type", Rows.GuildMemberRow, (args: any[], res: any) => {
                const user = args[0]?.user;
                if (!platformIndicatorSettings.userList) return;
                const statusIconsView = findInReactTree(res, c => c.key === "GuildMemberRowStatusIconsView");
                if (!statusIconsView) {
                    const row = findInReactTree(res, c => c.props?.style?.flexDirection === "row");
                    if (row) {
                        row.props.children.splice(2, 0,
                            <View
                                key="GuildMemberRowStatusIconsView"
                                style={{
                                    flexDirection: "row"
                                }}>
                                {debugLabels ? <Text>GMRSIV</Text> : <StatusIcons userId={user.id} />}
                            </View>
                        );
                    }
                }
            }));
        }

        let patchedAvatar = false;
        // User row patch
        const rowPatch = (args: any[], res: any) => {
            const user = args[0]?.user;
            if (!platformIndicatorSettings.userList) return;

            const modifiedStatusIcons = findInReactTree(res?.props?.label, c => c.key === "TabsV2MemberListStatusIconsView");
            if (!modifiedStatusIcons) {
                res.props.label = (
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center"
                    }}
                    key="TabsV2MemberListStatusIconsView">
                        {res.props.label}
                        <View key="TabsV2MemberListStatusIconsView" style={{
                            flexDirection: "row"
                        }}>
                            {debugLabels ? <Text>TV2MLSIV</Text> : <StatusIcons userId={user.id} />}
                        </View>
                    </View>
                );
                if (!patchedAvatar && res.props.icon?.type) {
                    unpatches.push(before("type", res.props.icon.type, args => {
                        if (platformIndicatorSettings.removeDefaultMobile) {
                            args[0].isMobileOnline = false;
                        }
                    }));
                    patchedAvatar = true;
                }
            }
        };

        findByTypeNameAll("UserRow").forEach(UserRow => unpatches.push(after("type", UserRow, rowPatch)));

        // Messages item channel content
        const MessagesItemChannelContent = findByTypeName("MessagesItemChannelContent");
        unpatches.push(after("type", MessagesItemChannelContent, (args, res) => {
            const channel = args[0]?.channel;
            if (channel?.recipients?.length === 1) {
                const userId = channel.recipients[0];
                const textContainer = findInReactTree(res, m => m.props?.children?.[0]?.props?.variant === "redesign/channel-title/semibold");
                if (textContainer) {
                    textContainer.props.children.push(<View key="TabsV2RedesignDMListIcons" style={{
                        flexDirection: "row"
                    }}>
                        {debugLabels ? <Text>TV2RDMLI</Text> : <StatusIcons userId={userId} />}
                    </View>);
                }
            }
        }));
    },
    stop() {
        for (const unpatch of unpatches) unpatch();
        unpatches.length = 0;
    },
    settings: Settings,
});
