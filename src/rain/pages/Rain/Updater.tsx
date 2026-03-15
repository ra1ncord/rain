import { findAssetId } from "@api/assets";
import { getDebugInfo } from "@api/debug";
import UpdateModule from "@api/native/modules/update";
import { CODEBERG } from "@lib/info";
import { Strings } from "@i18n";
import { CodebergIcon, RainIcon } from "@assets";
import { AlertActionButton, AlertActions, AlertModal, Button, Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { openAlert } from "@api/ui/alerts";
import { BundleUpdaterManager } from "@api/native/modules";
import { useLoaderConfig } from "@api/settings";

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
    const loaderConfig = useLoaderConfig();
    if (loaderConfig.customLoadUrl.enabled) { return false }
    
    const [hasUpdate, setHasUpdate] = React.useState(false);
    React.useEffect(() => {
        fetch("https://codeberg.org/api/v1/repos/raincord/rain/releases?limit=1")
            .then(r => r.json())
            .then(([latestRelease]) => setHasUpdate(!!latestRelease && isNewerVersion(latestRelease.tag_name, getDebugInfo().rain.version)));
    }, []);
    return(hasUpdate)
}

export default function Updater() {
    const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
    _setIsChecking = setIsCheckingForUpdates;
    const debugInfo = getDebugInfo();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.INFO}>
                    <TableRow
                        label={Strings.RAIN}
                        icon={<TableRow.Icon source={{ uri: RainIcon }} />}
                        trailing={<TableRow.TrailingText text={debugInfo.rain.version} />}
                    />
                    <TableRow
                        arrow
                        label={Strings.CODEBERG}
                        icon={<TableRow.Icon source={{ uri: CodebergIcon }} />}
                        trailing={<TableRow.TrailingText text="raincord/rain" />}
                        onPress={() => Linking.openURL(CODEBERG)}
                    />
                </TableRowGroup>
                {checkForUpdate() && <View style={{ flexShrink: 1 }}>
                    <Button
                        text={Strings.UPDATE}
                        icon={findAssetId("DownloadIcon")}
                        disabled={isCheckingForUpdates}
                        loading={isCheckingForUpdates}
                        onPress={() => {
                            downloadUpdate;
                            openAlert(
                                "update-restart-alert",
                                <AlertModal
                                    title={Strings.RELOAD_DISCORD}
                                    content={Strings.UPDATE_RESTART_MESSAGE}
                                    actions={
                                        <AlertActions>
                                            <AlertActionButton
                                                text={Strings.RESTART_NOW}
                                                variant="primary"
                                                onPress={() => {
                                                    BundleUpdaterManager.reload();
                                                }}
                                            />
                                            <AlertActionButton text={Strings.RESTART_LATER} variant="secondary" />
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
