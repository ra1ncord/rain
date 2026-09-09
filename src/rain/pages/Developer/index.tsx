import { findAssetId } from "@api/assets";
import { connectToDebugger, disconnectFromDebugger, hotReloadTheme, isConnectedToDebugger } from "@api/debug";
import { isLoaderConfigSupported } from "@api/native/loader";
import { useLoaderConfig, useSettings } from "@api/settings";
import { ErrorBoundary } from "@api/ui/components";
import { semanticColors } from "@api/ui/components/color";
import { createStyles, TextStyleSheet } from "@api/ui/styles";
import { Strings } from "@i18n";
import { NavigationNative } from "@metro/common";
import { LegacyFormText, Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import { findByProps } from "@metro/wrappers";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import AssetBrowser from "./AssetBrowser";

const useStyles = createStyles({
    leadingText: {
        ...TextStyleSheet["heading-md/semibold"],
        color: semanticColors.TEXT_MUTED,
        marginRight: -4
    },
});

// todo: reimplement react devtools
export default function Developer() {
    const settings = useSettings();
    const loaderConfig = useLoaderConfig();

    const [isDebuggerConnected, setIsDebuggerConnected] = useState(isConnectedToDebugger());

    const styles = useStyles();
    const navigation = NavigationNative.useNavigation();

    useEffect(() => {
        const interval = setInterval(() => {
            const connected = isConnectedToDebugger();
            if (connected !== isDebuggerConnected) setIsDebuggerConnected(connected);
        }, 1000);
        return () => clearInterval(interval);
    }, [isDebuggerConnected]);

    const handleDebuggerConnect = () => {
        if (isDebuggerConnected) {
            disconnectFromDebugger();
            setIsDebuggerConnected(false);
        } else {
            connectToDebugger(settings.debuggerUrl);
            setTimeout(() => setIsDebuggerConnected(isConnectedToDebugger()), 100);
        }
    };

    const showSimpleActionSheet = findByProps("showSimpleActionSheet")?.showSimpleActionSheet;
    const hideActionSheet = findByProps("openLazy", "hideActionSheet")?.hideActionSheet;

    return (
        <ErrorBoundary>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
                <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>

                    <TableRowGroup title={Strings.DEBUGGER_URL}>
                        <TextInput
                            placeholder="127.0.0.1:9090"
                            size="md"
                            leadingIcon={() => <LegacyFormText style={styles.leadingText}>ws://</LegacyFormText>}
                            defaultValue={settings.debuggerUrl}
                            onChange={(v: string) => settings.updateSettings({ debuggerUrl: v })}
                        />
                        <Stack style={{ marginTop: 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" }}>
                            <TableSwitchRow
                                label={Strings.AUTO_DEBUGGER}
                                subLabel={isDebuggerConnected ? Strings.CONNECTED : undefined}
                                icon={<TableRow.Icon source={findAssetId("copy")} />}
                                value={settings.autoDebugger}
                                onValueChange={(v: boolean) => settings.updateSettings({ autoDebugger: v })}
                            />
                        </Stack>
                        <TableRow
                            label={isDebuggerConnected ? Strings.DISCONNECT_FROM_DEBUGGER : Strings.CONNECT_TO_DEBUG_WEBSOCKET}
                            icon={<TableRow.Icon source={findAssetId(isDebuggerConnected ? "ic_message_delete" : "copy")} />}
                            onPress={handleDebuggerConnect}
                        />
                    </TableRowGroup>
                    {isLoaderConfigSupported() && (
                        <TableRowGroup title={Strings.LOADER_CONFIG}>
                            <TableSwitchRow
                                label={Strings.LOAD_FROM_CUSTOM_URL}
                                subLabel={Strings.LOAD_FROM_CUSTOM_URL_DEC}
                                icon={<TableRow.Icon source={findAssetId("copy")} />}
                                value={loaderConfig.customLoadUrl.enabled}
                                onValueChange={(v: boolean) =>
                                    loaderConfig.updateLoaderConfig({
                                        customLoadUrl: { ...loaderConfig.customLoadUrl, enabled: v }
                                    })
                                }
                            />
                            {loaderConfig.customLoadUrl.enabled && (
                                <TableRow label={
                                    <TextInput
                                        defaultValue={loaderConfig.customLoadUrl.url}
                                        size="md"
                                        onChange={(v: string) =>
                                            loaderConfig.updateLoaderConfig({
                                                customLoadUrl: { ...loaderConfig.customLoadUrl, url: v }
                                            })
                                        }
                                        placeholder="http://localhost:4040/rain.js"
                                        label={Strings.RAIN_URL}
                                    />
                                } />
                            )}
                        </TableRowGroup>
                    )}

                    <TableRowGroup title={Strings.HOT_RELOAD_THEME}>
                        <TextInput
                            defaultValue={settings.hotReloadThemeUrl}
                            size="md"
                            placeholder="http://localhost:4040/theme.json"
                            onChange={(v: string) =>
                                settings.updateSettings({ hotReloadThemeUrl: v })
                            }
                        />
                        <Stack style={{ marginTop: 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" }}>
                            <TableSwitchRow
                                label={Strings.HOT_RELOAD_THEME}
                                subLabel={Strings.HOT_RELOAD_THEME_DESC}
                                icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />}
                                value={settings.hotReloadTheme}
                                onValueChange={(v: boolean) =>
                                    settings.updateSettings({ hotReloadTheme: v })
                                }
                            />
                        </Stack>
                        <TableRow
                            label={Strings.CONNECT_TO_HOT_RELOAD_THEME}
                            icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />}
                            onPress={async () => {
                                hotReloadTheme();
                            }}
                        />
                    </TableRowGroup>

                    <TableRowGroup title={Strings.OTHER}>
                        <TableSwitchRow
                            label={Strings.DISABLE_UPDATE_WARNING}
                            icon={<TableRow.Icon source={findAssetId("UploadIcon")!} />}
                            value={settings.disableUpdateWarnings}
                            onValueChange={(v: boolean) =>
                                settings.updateSettings({ disableUpdateWarnings: v })
                            }
                        />
                        <TableRow
                            arrow
                            label={Strings.ASSET_BROWSER}
                            icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
                            onPress={() => navigation.push("RAIN_CUSTOM_PAGE", { render: () => <AssetBrowser /> })}
                        />
                        <TableRow
                            arrow
                            label={Strings.ERROR_BOUNDARY_TOOLS_LABEL}
                            icon={<TableRow.Icon source={findAssetId("ic_warning_24px")} />}
                            onPress={() => showSimpleActionSheet({
                                key: "ErrorBoundaryTools",
                                header: {
                                    title: Strings.ERROR_BOUNDARY_QUESTION,
                                    icon: <TableRow.Icon style={{ marginRight: 8 }} source={findAssetId("ic_warning_24px")} />,
                                    onClose: () => hideActionSheet(),
                                },
                                options: [
                                    // @ts-expect-error this needs to be an error so it crashes duh
                                    { label: Strings.RAIN, onPress: () => navigation.push("RAIN_CUSTOM_PAGE", { render: () => <undefined /> }) },
                                    { label: Strings.DISCORD, isDestructive: true, onPress: () => navigation.push("RAIN_CUSTOM_PAGE", { noErrorBoundary: true }) },
                                ],
                            })}
                        />
                    </TableRowGroup>
                </Stack>
            </ScrollView>
        </ErrorBoundary>
    );
}
