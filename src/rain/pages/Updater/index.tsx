import { findAssetId } from "@api/assets";
import { getDebugInfo } from "@api/debug";
import { BundleUpdaterManager } from "@api/native/modules";
import UpdateModule from "@api/native/modules/update";
import { useLoaderConfig } from "@api/settings";
import { openAlert } from "@api/ui/alerts";
import { CodebergIcon, RainIcon } from "@assets";
import { Strings } from "@i18n";
import { CODEBERG } from "@lib/info";
import { AlertActionButton, AlertActions, AlertModal, Button, Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";

let _setIsChecking: ((v: boolean) => void) | null = null;

function isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => version.replace(/^v/, "").split(".").map(Number);
    const [remoteMajor, remoteMinor, remotePatch] = parseVersion(remoteVersion);
    const [currentMajor, currentMinor, currentPatch] = parseVersion(currentVersion);
    if (remoteMajor !== currentMajor) return remoteMajor > currentMajor;
    if (remoteMinor !== currentMinor) return remoteMinor > currentMinor;
    return remotePatch > currentPatch;
}

export function downloadUpdate() {
    _setIsChecking?.(true);
    UpdateModule.nativeDownload();
    _setIsChecking?.(false);
}

export function checkForUpdate() {
    const [hasUpdate, setHasUpdate] = React.useState(false);

    React.useEffect(() => {
        if (useLoaderConfig.getState().customLoadUrl.enabled) return;
        fetch("https://codeberg.org/api/v1/repos/raincord/rain/releases?limit=1")
            .then(r => r.json())
            .then(([latestRelease]) => setHasUpdate(!!latestRelease && isNewerVersion(latestRelease.tag_name, getDebugInfo().rain.version)));
    }, []);

    return hasUpdate;
}

export default function Updater() {
    const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
    _setIsChecking = setIsCheckingForUpdates;
    const debugInfo = getDebugInfo();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.GENERAL.CORE.INFO}>
                    <TableRow
                        label={Strings.GENERAL.CORE.RAIN}
                        icon={<TableRow.Icon source={{ uri: RainIcon }} />}
                        trailing={<TableRow.TrailingText text={debugInfo.rain.version} />}
                    />
                    <TableRow
                        arrow
                        label={Strings.GENERAL.CORE.CODEBERG}
                        icon={<TableRow.Icon source={{ uri: CodebergIcon }} />}
                        trailing={<TableRow.TrailingText text="raincord/rain" />}
                        onPress={() => Linking.openURL(CODEBERG)}
                    />
                </TableRowGroup>
                {checkForUpdate() && <View style={{ flexShrink: 1 }}>
                    <Button
                        text={Strings.GENERAL.CORE.UPDATE}
                        icon={findAssetId("DownloadIcon")}
                        disabled={isCheckingForUpdates}
                        loading={isCheckingForUpdates}
                        onPress={() => {
                            downloadUpdate();
                            openAlert(
                                "update-restart-alert",
                                <AlertModal
                                    title={Strings.GENERAL.CORE.RELOAD_DISCORD}
                                    content={Strings.GENERAL.CORE.UPDATE_RESTART_MESSAGE}
                                    actions={
                                        <AlertActions>
                                            <AlertActionButton
                                                text={Strings.GENERAL.CORE.RESTART_NOW}
                                                variant="primary"
                                                onPress={() => {
                                                    BundleUpdaterManager.reload();
                                                }}
                                            />
                                            <AlertActionButton text={Strings.GENERAL.CORE.RESTART_LATER} variant="secondary" />
                                        </AlertActions>
                                    }
                                />,
                            );
                        }}
                    />
                </View>}
            </Stack>
        </ScrollView>
    );
}
