import { findAssetId } from "@api/assets";
import { getDebugInfo } from "@api/debug";
import { BundleUpdaterManager } from "@api/native/modules";
import { useSettings } from "@api/settings";
import { openAlert } from "@api/ui/alerts";
import { CodebergIcon, KofiIcon,RainIcon } from "@assets";
import { CODEBERG, DEVELOPERS,DISCORD_SERVER, GITHUB, KOFI } from "@lib/info";
import { NavigationNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Linking, ScrollView } from "react-native";

import About from "./About";

export default function General() {
    const debugInfo = getDebugInfo();
    const navigation = NavigationNative.useNavigation();

    const { developerSettings, safeMode, updateSettings } = useSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={"Info"}>
                    <TableRow
                        label={"Rain"}
                        icon={<TableRow.Icon source={{ uri: RainIcon }} />}
                        trailing={<TableRow.TrailingText text={debugInfo.rain.version} />}
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
                <TableRowGroup title={"Settings"}>
                    <TableSwitchRow
                        label={"Safe Mode"}
                        icon={<TableRow.Icon source={findAssetId("ShieldIcon")!} />}
                        // @ts-expect-error
                        value={safeMode}
                        onValueChange={(v: boolean) => {
                            updateSettings({ safeMode: v });
                            openAlert(
                                "rain-reload-safe-mode",
                                <AlertModal
                                    title="Reload now?"
                                    content={"You must reload for this to take effect, in safe mode all plugins/themes are disabled"}
                                    actions={<AlertActions>
                                        <AlertActionButton
                                            text="Reload Now"
                                            variant="destructive"
                                            onPress={() => BundleUpdaterManager.reload()}
                                        />
                                        <AlertActionButton text="Later" variant="secondary" />
                                    </AlertActions>}
                                />
                            );
                        }}
                    />
                    <TableSwitchRow
                        label={"Developer Settings"}
                        icon={<TableRow.Icon source={findAssetId("WrenchIcon")!} />}
                        value={developerSettings}
                        onValueChange={(v: boolean) => {
                            updateSettings({ developerSettings: v });
                        }}
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
                        icon={<TableRow.Icon source={{ uri: CodebergIcon }} />}
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
            </Stack>
        </ScrollView>
    );
}
