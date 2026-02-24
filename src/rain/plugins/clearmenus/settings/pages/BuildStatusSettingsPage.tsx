import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useSettingsSections } from "../../storage";

export default function BuildStatusSettingsPage() {
    const settingsSections = useSettingsSections();
    return (
        <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="Build Status">
                    <TableSwitchRow label="Hide All" value={!!settingsSections.buildStatus.hideAll} onValueChange={v => settingsSections.updateSettings({ buildStatus: { ...settingsSections.buildStatus, hideAll: v } })} />
                    <TableSwitchRow label="Hide Internal Build Active" value={!!settingsSections.buildStatus.INTERNAL_BUILD_ACTIVE} disabled={!!settingsSections.buildStatus.hideAll} onValueChange={v => settingsSections.updateSettings({ buildStatus: { ...settingsSections.buildStatus, INTERNAL_BUILD_ACTIVE: v } })} />
                    <TableSwitchRow label="Hide Internal Build Update" value={!!settingsSections.buildStatus.INTERNAL_BUILD_UPDATE} disabled={!!settingsSections.buildStatus.hideAll} onValueChange={v => settingsSections.updateSettings({ buildStatus: { ...settingsSections.buildStatus, INTERNAL_BUILD_UPDATE: v } })} />
                    <TableSwitchRow label="Hide Build Override Active" value={!!settingsSections.buildStatus.BUILD_OVERRIDE_ACTIVE} disabled={!!settingsSections.buildStatus.hideAll} onValueChange={v => settingsSections.updateSettings({ buildStatus: { ...settingsSections.buildStatus, BUILD_OVERRIDE_ACTIVE: v } })} />
                    <TableSwitchRow label="Hide Experiment Override Active" icon={<TableRow.Icon source={findAssetId("BeakerIcon")} />} value={!!settingsSections.buildStatus.EXPERIMENT_OVERRIDE_ACTIVE} disabled={!!settingsSections.buildStatus.hideAll} onValueChange={v => settingsSections.updateSettings({ buildStatus: { ...settingsSections.buildStatus, EXPERIMENT_OVERRIDE_ACTIVE: v } })} />
                </TableRowGroup>
            </Stack>
        </ReactNative.ScrollView>
    );
}
