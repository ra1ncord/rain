import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useSettingsSections } from "../../storage";

export default function StaffSettingsPage() {
    const settingsSections = useSettingsSections();
    return (
        <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="Staff Settings">
                    <TableSwitchRow label="Hide All" value={!!settingsSections.staffSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ staffSettings: { ...settingsSections.staffSettings, hideAll: v } })} />
                    <TableSwitchRow label="Hide Show Dev Widget" icon={<TableRow.Icon source={findAssetId("StaffBadgeIcon")} />} value={!!settingsSections.staffSettings.SHOW_DEV_WIDGET} disabled={!!settingsSections.staffSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ staffSettings: { ...settingsSections.staffSettings, SHOW_DEV_WIDGET: v } })} />
                    <TableSwitchRow label="Hide Show Dev Tools" icon={<TableRow.Icon source={findAssetId("StaffBadgeIcon")} />} value={!!settingsSections.staffSettings.SHOW_DEV_TOOLS} disabled={!!settingsSections.staffSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ staffSettings: { ...settingsSections.staffSettings, SHOW_DEV_TOOLS: v } })} />
                    <TableSwitchRow label="Hide Design Systems" icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />} value={!!settingsSections.staffSettings.DESIGN_SYSTEMS} disabled={!!settingsSections.staffSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ staffSettings: { ...settingsSections.staffSettings, DESIGN_SYSTEMS: v } })} />
                </TableRowGroup>
            </Stack>
        </ReactNative.ScrollView>
    );
}
