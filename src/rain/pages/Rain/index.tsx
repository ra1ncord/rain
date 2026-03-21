import { findAssetId } from "@api/assets";
import { getDebugInfo } from "@api/debug";
import { BundleUpdaterManager } from "@api/native/modules";
import { useSettings } from "@api/settings";
import { openAlert } from "@api/ui/alerts";
import { resolveSemanticColor, semanticColors } from "@api/ui/components/color";
import { CodebergIcon, KofiIcon,RainIcon } from "@assets";
import { Strings } from "@i18n";
import { CODEBERG, DISCORD_SERVER, GITHUB, KOFI } from "@lib/info";
import { NavigationNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow, Text } from "@metro/common/components";
import { Image, Linking, ScrollView, View } from "react-native";

import About from "./About";
import { InfoCard } from "./components/InfoCard";
import Developers from "./Developers";
import Updater, { checkForUpdate } from "./Updater";

async function disableDevOnlyPlugins() {
    const { pluginInstances, usePluginSettings, stopPlugin } = await import("@plugins");
    const settings = usePluginSettings.getState().settings;
    const devOnlyPlugins = [...pluginInstances.entries()]
        .filter(([id, plugin]) => plugin.devOnly && settings[id]?.enabled)
        .map(([id]) => id);

    for (const id of devOnlyPlugins) {
        try {
            await stopPlugin(id);
        } catch (e) {
        }
    }
}

export default function General() {
    const debugInfo = getDebugInfo();
    const navigation = NavigationNative.useNavigation();

    const { developerSettings, safeMode, updateSettings } = useSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <View style={{ gap: 10 }}>
                    <Text color="text-strong" variant="text-sm/semibold">{Strings.UPDATER}</Text>
                    <InfoCard
                        title={Strings.UPDATER}
                        style={{ flex: 1 }}
                        icon={<TableRow.Icon source={{ uri: RainIcon }} />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: Strings.UPDATER,
                                render: () => <Updater />,
                            })
                        }
                        trailing={
                            (() => {
                                if (checkForUpdate()) {
                                    return (
                                        <View >
                                            <Image
                                                source={findAssetId("ic_warning_24px")}
                                                style={{ width: 32, height: 32, tintColor: resolveSemanticColor(semanticColors.STATUS_WARNING) }}
                                            />
                                        </View>
                                    );
                                }
                                return `(${debugInfo.rain.version})`;
                            })()
                        }
                    />
                </View>
                <TableRowGroup title={Strings.INFO}>
                    <TableRow
                        label={Strings.RAIN}
                        icon={<TableRow.Icon source={{ uri: RainIcon }} />}
                        trailing={<TableRow.TrailingText text={debugInfo.rain.version} />}
                    />
                    <TableRow
                        label={Strings.DISCORD}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        trailing={<TableRow.TrailingText text={`${debugInfo.discord.version} (${debugInfo.discord.build})`} />}
                    />
                    <TableRow
                        arrow
                        label={Strings.ABOUT}
                        icon={<TableRow.Icon source={findAssetId("CircleInformationIcon-primary")!} />}
                        onPress={() => navigation.push("RAIN_CUSTOM_PAGE", {
                            title: Strings.ABOUT,
                            render: () => <About />,
                        })}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.SETTINGS}>
                    <TableRow
                        label="Reload App"
                        icon={<TableRow.Icon source={findAssetId("RetryIcon")!} />}
                        onPress={() => BundleUpdaterManager.reload()}
                    />
                    <TableSwitchRow
                        label={Strings.SAFE_MODE}
                        icon={<TableRow.Icon source={findAssetId("ShieldIcon")!} />}
                        // @ts-expect-error
                        value={safeMode}
                        onValueChange={(v: boolean) => {
                            updateSettings({ safeMode: v });
                            openAlert(
                                "rain-reload-safe-mode",
                                <AlertModal
                                    title={Strings.RELOAD_DISCORD}
                                    content={Strings.SAFE_MODE_REQUIRES_RELOAD}
                                    actions={<AlertActions>
                                        <AlertActionButton
                                            text={Strings.RELOAD}
                                            variant="destructive"
                                            onPress={() => BundleUpdaterManager.reload()}
                                        />
                                        <AlertActionButton text={Strings.LATER} variant="secondary" />
                                    </AlertActions>}
                                />
                            );
                        }}
                    />
                    <TableSwitchRow
                        label={Strings.DEVELOPER_SETTINGS}
                        icon={<TableRow.Icon source={findAssetId("WrenchIcon")!} />}
                        value={developerSettings}
                        onValueChange={async (v: boolean) => {
                            if (!v) {
                                await disableDevOnlyPlugins();
                            }
                            updateSettings({ developerSettings: v });
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.RAIN_LINKS}>
                    <TableRow
                        arrow={true}
                        label={Strings.DISCORD_SERVER}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        onPress={() => Linking.openURL(DISCORD_SERVER)}
                    />
                    <TableRow
                        arrow={true}
                        label={Strings.CODEBERG}
                        icon={<TableRow.Icon source={{ uri: CodebergIcon }} />}
                        onPress={() => Linking.openURL(CODEBERG)}
                    />
                    <TableRow
                        arrow={true}
                        label={Strings.GITHUB}
                        icon={<TableRow.Icon source={findAssetId("img_account_sync_github_white")!} />}
                        onPress={() => Linking.openURL(GITHUB)}
                    />
                    <TableRow
                        arrow={true}
                        label={Strings.KOFI}
                        icon={<TableRow.Icon source={{ uri: KofiIcon }} />}
                        onPress={() => Linking.openURL(KOFI)}
                    />
                    <TableRow
                        arrow={true}
                        label={Strings.DEVELOPERS}
                        icon={<TableRow.Icon source={findAssetId("CircleInformationIcon-primary")!} />}
                        onPress={() => navigation.push("RAIN_CUSTOM_PAGE", {
                            title: Strings.DEVELOPERS,
                            render: () => <Developers />,
                        })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
