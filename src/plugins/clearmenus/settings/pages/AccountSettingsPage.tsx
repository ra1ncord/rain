import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useSettingsSections } from "../../storage";

export default function AccountSettingsPage() {
    const settingsSections = useSettingsSections();
    return (
        <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="Account Settings">
                    <TableSwitchRow
                        label="Hide All"
                        value={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, hideAll: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Account"
                        icon={<TableRow.Icon source={findAssetId("UserCircleIcon")} />}
                        value={!!settingsSections.account.ACCOUNT}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, ACCOUNT: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Content & Social"
                        icon={<TableRow.Icon source={findAssetId("FriendsIcon")} />}
                        value={!!settingsSections.account.CONTENT_AND_SOCIAL}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, CONTENT_AND_SOCIAL: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Data & Privacy"
                        icon={<TableRow.Icon source={findAssetId("ShieldLockIcon")} />}
                        value={!!settingsSections.account.DATA_AND_PRIVACY}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, DATA_AND_PRIVACY: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Family Center"
                        icon={<TableRow.Icon source={findAssetId("GroupIcon")} />}
                        value={!!settingsSections.account.FAMILY_CENTER}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, FAMILY_CENTER: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Authorized Apps"
                        icon={<TableRow.Icon source={findAssetId("KeyIcon")} />}
                        value={!!settingsSections.account.AUTHORIZED_APPS}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, AUTHORIZED_APPS: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Devices"
                        icon={<TableRow.Icon source={findAssetId("LaptopPhoneIcon")} />}
                        value={!!settingsSections.account.DEVICES}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, DEVICES: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Connections"
                        icon={<TableRow.Icon source={findAssetId("PuzzlePieceIcon")} />}
                        value={!!settingsSections.account.CONNECTIONS}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, CONNECTIONS: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Clips"
                        icon={<TableRow.Icon source={findAssetId("ClipsIcon")} />}
                        value={!!settingsSections.account.CLIPS}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, CLIPS: v } })}
                    />
                    <TableSwitchRow
                        label="Hide Scan QR Code"
                        icon={<TableRow.Icon source={findAssetId("QrCodeIcon")} />}
                        value={!!settingsSections.account.SCAN_QR_CODE}
                        disabled={!!settingsSections.account.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ account: { ...settingsSections.account, SCAN_QR_CODE: v } })}
                    />
                </TableRowGroup>
            </Stack>
        </ReactNative.ScrollView>
    );
}
