import { findAssetId } from "@api/assets";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { getData, saveData } from "@plugins/_core/cloudsync/api";
import showAuthModal from "@plugins/_core/cloudsync/lib/showAuthModal";
import { grabEverything, importData } from "@plugins/_core/cloudsync/lib/syncStuff";
import { useCloudSyncSettings } from "@plugins/_core/cloudsync/storage";
import { useAuthorizationStore } from "@plugins/_core/cloudsync/stores/AuthorizationStore";
import { useCacheStore } from "@plugins/_core/cloudsync/stores/CacheStore";
import React from "react";
import { ActivityIndicator,ScrollView } from "react-native";

const { Card } = findByProps("Card");

export default function CloudSyncSettings() {
    const settings = useCloudSyncSettings();
    const auth = useAuthorizationStore();
    const cache = useCacheStore();
    const [isBusy, setBusy] = React.useState<string | null>(null);

    const handleAuth = async () => {
        showAuthModal();
    };

    const handleSync = async () => {
        setBusy("sync");
        try {
            const everything = await grabEverything();
            await saveData(everything);
            showToast("Data synced successfully!", findAssetId("CheckIcon"));
        } catch (e) {
            showToast("Failed to sync data.", findAssetId("CircleXIcon"));
        }
        setBusy(null);
    };

    const handleImport = async () => {
        setBusy("import");
        try {
            const data = await getData();
            await importData(data);
            showToast("Data imported successfully!", findAssetId("CheckIcon"));
        } catch (e) {
            showToast("Failed to import data.", findAssetId("CircleXIcon"));
        }
        setBusy(null);
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Authorization">
                    {!auth.isAuthorized() ? (
                        <TableRow
                            label="Authorize with Discord"
                            subLabel="Required to sync your data to the cloud"
                            icon={<TableRow.Icon source={findAssetId("Discord")} />}
                            onPress={handleAuth}
                        />
                    ) : (
                        <>
                            <TableRow
                                label="Authorized"
                                subLabel="You are logged in and ready to sync"
                                icon={<TableRow.Icon source={findAssetId("CircleCheckIcon")} />}
                                disabled
                            />
                            <TableRow
                                variant="danger"
                                label="Log out"
                                subLabel="Disconnect your account from Cloud Sync"
                                icon={<TableRow.Icon variant="danger" source={findAssetId("DoorExitIcon")} />}
                                onPress={() => auth.setToken(undefined)}
                            />
                        </>
                    )}
                </TableRowGroup>

                {auth.isAuthorized() && (
                    <TableRowGroup title="Sync Actions">
                        <TableRow
                            label="Sync to Cloud"
                            subLabel="Upload your current plugins, themes, and fonts."
                            icon={isBusy === "sync" ? <ActivityIndicator size="small" /> : <TableRow.Icon source={findAssetId("UploadIcon")} />}
                            onPress={handleSync}
                        />
                        <TableRow
                            label="Import from Cloud"
                            subLabel="Download and apply your saved data"
                            icon={isBusy === "import" ? <ActivityIndicator size="small" /> : <TableRow.Icon source={findAssetId("DownloadIcon")} />}
                            onPress={handleImport}
                        />
                    </TableRowGroup>
                )}

                <TableRowGroup title="Settings">
                    <TableSwitchRow
                        label="Auto Sync"
                        subLabel="Automatically sync changes to the cloud"
                        icon={<TableRow.Icon source={findAssetId("RefreshIcon")} />}
                        value={settings.autoSync}
                        onValueChange={(v: boolean) => settings.updateSettings({ autoSync: v })}
                    />
                </TableRowGroup>

                <TableRowGroup title="Custom Hosting">
                    <Card>
                        <SettingsTextInput
                            placeholder="Custom Host URL"
                            value={settings.customHost}
                            onChange={(v: string) => settings.updateSettings({ customHost: v })}
                            isClearable
                        />
                        <SettingsTextInput
                            placeholder="Custom Client ID"
                            value={settings.customClientId}
                            onChange={(v: string) => settings.updateSettings({ customClientId: v })}
                            isClearable
                        />
                    </Card>
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
