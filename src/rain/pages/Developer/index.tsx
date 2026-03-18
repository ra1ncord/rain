import { findAssetId } from "@api/assets";
import { connectToDebugger, disconnectFromDebugger, hotReloadTheme, isConnectedToDebugger } from "@api/debug";
import { getReactDevToolsProp, isLoaderConfigSupported, isReactDevToolsPreloaded } from "@api/native/loader";
import { useLoaderConfig,useSettings } from "@api/settings";
import { CheckState, useFileExists } from "@api/storage/useFS";
import { ErrorBoundary } from "@api/ui/components";
import { semanticColors } from "@api/ui/components/color";
import { createStyles, TextStyleSheet } from "@api/ui/styles";
import { showToast } from "@api/ui/toasts";
import { Strings } from "@i18n";
import { NavigationNative } from "@metro/common";
import { Button, LegacyFormText, Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import { findByProps } from "@metro/wrappers";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import AssetBrowser from "./AssetBrowser";

const RDT_EMBED_LINK = "https://codeberg.org/raincord/raindevtools/raw/branch/dev/dist/index.bundle";

const useStyles = createStyles({
    leadingText: {
        ...TextStyleSheet["heading-md/semibold"],
        color: semanticColors.TEXT_MUTED,
        marginRight: -4
    },
});

export default function Developer() {
    const settings = useSettings();
    const loaderConfig = useLoaderConfig();

    const [rdtFileExists, fs] = useFileExists("preloads/reactDevtools.js");
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

                    <TableRowGroup title={Strings.GENERAL.DEVELOPER.DEBUGGER_URL}>
                        <TextInput
                            placeholder="127.0.0.1:9090"
                            size="md"
                            leadingIcon={() => <LegacyFormText style={styles.leadingText}>ws://</LegacyFormText>}
                            defaultValue={settings.debuggerUrl}
                            onChange={(v: string) => settings.updateSettings({ debuggerUrl: v })}
                        />
                        <Stack style={{ marginTop: 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" }}>
                            <TableSwitchRow
                                label={Strings.GENERAL.DEVELOPER.AUTO_DEBUGGER}
                                subLabel={isDebuggerConnected ? Strings.GENERAL.DEVELOPER.CONNECTED : undefined}
                                icon={<TableRow.Icon source={findAssetId("copy")} />}
                                value={settings.autoDebugger}
                                onValueChange={(v: boolean) => settings.updateSettings({ autoDebugger: v })}
                            />
                        </Stack>
                        <TableRow
                            label={isDebuggerConnected ? Strings.GENERAL.DEVELOPER.DISCONNECT_FROM_DEBUGGER : Strings.GENERAL.DEVELOPER.CONNECT_TO_DEBUG_WEBSOCKET}
                            icon={<TableRow.Icon source={findAssetId(isDebuggerConnected ? "ic_message_delete" : "copy")} />}
                            onPress={handleDebuggerConnect}
                        />
                    </TableRowGroup>

                    {isReactDevToolsPreloaded() && (
                        <TableRowGroup title={Strings.GENERAL.DEVELOPER.DEVTOOLS_URL}>
                            <TextInput
                                placeholder="127.0.0.1:8097"
                                size="md"
                                leadingIcon={() => <LegacyFormText style={styles.leadingText}>ws://</LegacyFormText>}
                                defaultValue={settings.devToolsUrl}
                                onChange={(v: string) => settings.updateSettings({ devToolsUrl: v })}
                            />
                            <Stack style={{ marginTop: 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" }}>
                                <TableSwitchRow
                                    label={Strings.GENERAL.DEVELOPER.AUTO_DEVTOOLS}
                                    icon={<TableRow.Icon source={findAssetId("ic_badge_staff")} />}
                                    value={settings.autoDevTools}
                                    onValueChange={(v: boolean) => settings.updateSettings({ autoDevTools: v })}
                                />
                            </Stack>
                            <TableRow
                                label={Strings.GENERAL.DEVELOPER.CONNECT_TO_REACT_DEVTOOLS}
                                icon={<TableRow.Icon source={findAssetId("ic_badge_staff")} />}
                                onPress={async () => {
                                    if (!settings.devToolsUrl?.trim()) {
                                        showToast(Strings.GENERAL.DEVELOPER.INVALID_DEVTOOLS_URL, findAssetId("Small"));
                                        return;
                                    }
                                    try {
                                        const devTools = window[getReactDevToolsProp() || "__vendetta_rdc"];
                                        if (!devTools?.connectToDevTools) {
                                            showToast(Strings.GENERAL.DEVELOPER.INVALID_DEVTOOLS_URL, findAssetId("Small"));
                                            return;
                                        }
                                        await devTools.connectToDevTools({
                                            host: settings.devToolsUrl.split(":")?.[0],
                                            resolveRNStyle: StyleSheet.flatten,
                                        });
                                    } catch (error) {
                                        showToast(Strings.GENERAL.DEVELOPER.INVALID_DEVTOOLS_URL, findAssetId("Small"));
                                    }
                                }}
                            />
                        </TableRowGroup>
                    )}

                    {isLoaderConfigSupported() && (
                        <TableRowGroup title={Strings.GENERAL.DEVELOPER.LOADER_CONFIG}>
                            <TableSwitchRow
                                label={Strings.GENERAL.DEVELOPER.LOAD_FROM_CUSTOM_URL}
                                subLabel={Strings.GENERAL.DEVELOPER.LOAD_FROM_CUSTOM_URL_DESC}
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
                                        label={Strings.GENERAL.DEVELOPER.CUSTOM_RAIN_URL}
                                    />
                                } />
                            )}
                        </TableRowGroup>
                    )}

                    <TableRowGroup title={Strings.GENERAL.DEVELOPER.HOT_RELOAD_THEME}>
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
                                label={Strings.GENERAL.DEVELOPER.HOT_RELOAD_THEME}
                                subLabel={Strings.GENERAL.DEVELOPER.HOT_RELOAD_THEME_DESC}
                                icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />}
                                value={settings.hotReloadTheme}
                                onValueChange={(v: boolean) =>
                                    settings.updateSettings({ hotReloadTheme: v })
                                }
                            />
                        </Stack>
                        <TableRow
                            label={Strings.GENERAL.DEVELOPER.CONNECT_TO_HOT_RELOAD_THEME}
                            icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />}
                            onPress={async () => {
                                hotReloadTheme();
                            }}
                        />
                    </TableRowGroup>

                    <TableRowGroup title={Strings.GENERAL.CORE.OTHER}>
                        <TableRow
                            arrow
                            label={Strings.GENERAL.DEVELOPER.ASSET_BROWSER}
                            icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
                            onPress={() => navigation.push("RAIN_CUSTOM_PAGE", { render: () => <AssetBrowser /> })}
                        />
                        <TableRow
                            arrow
                            label={Strings.GENERAL.DEVELOPER.ERROR_BOUNDARY_TOOLS_LABEL}
                            icon={<TableRow.Icon source={findAssetId("ic_warning_24px")} />}
                            onPress={() => showSimpleActionSheet({
                                key: "ErrorBoundaryTools",
                                header: {
                                    title: Strings.GENERAL.DEVELOPER.ERROR_BOUNDARY_QUESTION,
                                    icon: <TableRow.Icon style={{ marginRight: 8 }} source={findAssetId("ic_warning_24px")} />,
                                    onClose: () => hideActionSheet(),
                                },
                                options: [
                                    // @ts-expect-error this needs to be an error so it crashes duh
                                    { label: Strings.GENERAL.CORE.RAIN, onPress: () => navigation.push("RAIN_CUSTOM_PAGE", { render: () => <undefined /> }) },
                                    { label: Strings.GENERAL.CORE.DISCORD, isDestructive: true, onPress: () => navigation.push("RAIN_CUSTOM_PAGE", { noErrorBoundary: true }) },
                                ],
                            })}
                        />
                        <TableRow
                            label={Strings.GENERAL.DEVELOPER.INSTALL_REACT_DEVTOOLS}
                            subLabel={Strings.GENERAL.CORE.RESTART_REQUIRED_TO_TAKE_EFFECT}
                            icon={<TableRow.Icon source={findAssetId("DownloadIcon")} />}
                            trailing={
                                <Button
                                    size="sm"
                                    loading={rdtFileExists === CheckState.LOADING}
                                    disabled={rdtFileExists === CheckState.LOADING}
                                    variant={rdtFileExists === CheckState.TRUE ? "secondary" : "primary"}
                                    text={rdtFileExists === CheckState.TRUE ? Strings.GENERAL.CORE.UNINSTALL : Strings.GENERAL.CORE.INSTALL}
                                    onPress={async () => {
                                        if (rdtFileExists === CheckState.FALSE) {
                                            fs.downloadFile(RDT_EMBED_LINK, "preloads/reactDevtools.js");
                                        } else if (rdtFileExists === CheckState.TRUE) {
                                            fs.removeFile("preloads/reactDevtools.js");
                                        }
                                    }}
                                    icon={findAssetId(rdtFileExists === CheckState.TRUE ? "ic_message_delete" : "DownloadIcon")}
                                    style={{ marginLeft: 8 }}
                                />
                            }
                        />
                    </TableRowGroup>
                </Stack>
            </ScrollView>
        </ErrorBoundary>
    );
}
