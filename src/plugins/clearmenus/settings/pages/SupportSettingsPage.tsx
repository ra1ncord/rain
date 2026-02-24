import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useSettingsSections } from "../../storage";

export default function SupportSettingsPage() {
    const settingsSections = useSettingsSections();
    return (
        <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="Support">
                    <TableSwitchRow label="Hide All" value={!!settingsSections.support.hideAll} onValueChange={v => settingsSections.updateSettings({ support: { ...settingsSections.support, hideAll: v } })} />
                    <TableSwitchRow label="Hide Support Center" icon={<TableRow.Icon source={findAssetId("CircleQuestionIcon")} />} value={!!settingsSections.support.SUPPORT} disabled={!!settingsSections.support.hideAll} onValueChange={v => settingsSections.updateSettings({ support: { ...settingsSections.support, SUPPORT: v } })} />
                    <TableSwitchRow label="Hide Submit Ticket" icon={<TableRow.Icon source={findAssetId("TicketIcon")} />} value={!!settingsSections.support.SUBMIT_TICKET} disabled={!!settingsSections.support.hideAll} onValueChange={v => settingsSections.updateSettings({ support: { ...settingsSections.support, SUBMIT_TICKET: v } })} />
                    <TableSwitchRow label="Hide Help Articles" icon={<TableRow.Icon source={findAssetId("BookOpenIcon")} />} value={!!settingsSections.support.HELP_ARTICLES} disabled={!!settingsSections.support.hideAll} onValueChange={v => settingsSections.updateSettings({ support: { ...settingsSections.support, HELP_ARTICLES: v } })} />
                </TableRowGroup>
            </Stack>
        </ReactNative.ScrollView>
    );
}
