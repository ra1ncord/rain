import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useSettingsSections } from "../../storage";

export default function AppSettingsPage() {
    const settingsSections = useSettingsSections();
    return (
        <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="App Settings">
                    <TableSwitchRow label="Hide All" value={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, hideAll: v } })} />
                    <TableSwitchRow label="Hide Voice" icon={<TableRow.Icon source={findAssetId("MicrophoneIcon")} />} value={!!settingsSections.appSettings.VOICE} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, VOICE: v } })} />
                    <TableSwitchRow label="Hide Appearance" icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />} value={!!settingsSections.appSettings.APPEARANCE} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, APPEARANCE: v } })} />
                    <TableSwitchRow label="Hide Accessibility" icon={<TableRow.Icon source={findAssetId("AccessibilityIcon")} />} value={!!settingsSections.appSettings.ACCESSIBILITY} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, ACCESSIBILITY: v } })} />
                    <TableSwitchRow label="Hide Language" icon={<TableRow.Icon source={findAssetId("LanguageIcon")} />} value={!!settingsSections.appSettings.LANGUAGE} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, LANGUAGE: v } })} />
                    <TableSwitchRow label="Hide Chat" icon={<TableRow.Icon source={findAssetId("ChatIcon")} />} value={!!settingsSections.appSettings.CHAT} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, CHAT: v } })} />
                    <TableSwitchRow label="Hide Web Browser" icon={<TableRow.Icon source={findAssetId("ImageIcon")} />} value={!!settingsSections.appSettings.WEB_BROWSER} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, WEB_BROWSER: v } })} />
                    <TableSwitchRow label="Hide Notifications" icon={<TableRow.Icon source={findAssetId("BellIcon")} />} value={!!settingsSections.appSettings.NOTIFICATIONS} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, NOTIFICATIONS: v } })} />
                    <TableSwitchRow label="Hide App Icons" icon={<TableRow.Icon source={findAssetId("Discord")} />} value={!!settingsSections.appSettings.APP_ICONS} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, APP_ICONS: v } })} />
                    <TableSwitchRow label="Hide Advanced" icon={<TableRow.Icon source={findAssetId("SettingsIcon")} />} value={!!settingsSections.appSettings.ADVANCED} disabled={!!settingsSections.appSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ appSettings: { ...settingsSections.appSettings, ADVANCED: v } })} />
                </TableRowGroup>
            </Stack>
        </ReactNative.ScrollView>
    );
}
