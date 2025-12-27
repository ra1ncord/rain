import { findAssetId } from "@lib/api/assets";
import { NavigationNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow, Text } from "@metro/common/components";
import { Linking, ScrollView } from "react-native";
import { BundleUpdaterManager, NativeClientInfoModule } from "@lib/api/native/modules";
import { findByProps } from "@metro/wrappers";
import { useState } from "react";
import { RainIcon, CodebergIcon, KofiIcon } from "@assets";
import About from "../Rain/About";
import { getDebugInfo } from "@lib/api/debug";
import { settings } from "@lib/api/settings";
import { openAlert } from "@lib/ui/alerts";
import { DISCORD_SERVER, GITHUB, CODEBERG, KOFI, DEVELOPERS } from "@lib/info";
import { awaitStorage, useObservable } from "@lib/api/storage";

export default function General() {
    const debugInfo = getDebugInfo();
    const navigation = NavigationNative.useNavigation();

    awaitStorage(settings)
    useObservable([settings]);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={"Info"}>
                    <TableRow
                        label={"Rain"}
                        icon={<TableRow.Icon source={{ uri: RainIcon }} />}
                        trailing={<TableRow.TrailingText text={debugInfo.bunny.version} />}
                    />
                    <TableRow
                        label={"Discord"}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        trailing={<TableRow.TrailingText text={`${debugInfo.discord.version} (${debugInfo.discord.build})`} />}
                    />
                    <TableRow
                        arrow
                        label={"About"}
                        icon={<TableRow.Icon source={findAssetId("CircleInformationIcon-primary")!} />}
                        onPress={() => navigation.push("RAIN_CUSTOM_PAGE", {
                            title: "About",
                            render: () => <About />,
                        })}
                    />
                </TableRowGroup>
                <TableRowGroup title={"Rain Links"}>
                    <TableRow
                        arrow={true}
                        label={"Discord Server"}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        onPress={() => Linking.openURL(DISCORD_SERVER)}
                    />
                    <TableRow
                        arrow={true}
                        label={"Codeberg"}
                        icon={<TableRow.Icon source={{ uri: CodebergIcon}} />}
                        onPress={() => Linking.openURL(CODEBERG)}
                    />
                    <TableRow
                        arrow={true}
                        label={"GitHub"}
                        icon={<TableRow.Icon source={findAssetId("img_account_sync_github_white")!} />}
                        onPress={() => Linking.openURL(GITHUB)}
                    />
                    <TableRow
                        arrow={true}
                        label={"Kofi"}
                        icon={<TableRow.Icon source={{ uri: KofiIcon }} />}
                        onPress={() => Linking.openURL(KOFI)}
                    />
                    <TableRow
                        arrow={true}
                        label={"Developers"}
                        icon={<TableRow.Icon source={findAssetId("CircleInformationIcon-primary")!} />}
                        onPress={() => Linking.openURL(DEVELOPERS)}
                    />
                </TableRowGroup>
                <TableRowGroup title={"Settings"}>
                    <TableSwitchRow
                        label={"Developer Settings"}
                        icon={<TableRow.Icon source={findAssetId("WrenchIcon")!} />}
                        value={settings.developerSettings}
                        onValueChange={(v: boolean) => {
                            settings.developerSettings = v;
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
