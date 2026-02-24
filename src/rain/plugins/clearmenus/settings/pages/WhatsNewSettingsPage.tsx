import { React, ReactNative } from "@metro/common";
import { TableRowGroup, TableSwitchRow, Stack, TableRow } from "@metro/common/components";
import { semanticColors } from "@api/ui/components/color";
import { useSettingsSections } from "../../storage";
import { findAssetId } from "@api/assets";

export default function WhatsNewSettingsPage() {
  const settingsSections = useSettingsSections();
  return (
    <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
      <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
        <TableRowGroup title="What's New">
          <TableSwitchRow label="Hide All" value={!!settingsSections.whatsNew.hideAll} onValueChange={v => settingsSections.updateSettings({ whatsNew: { ...settingsSections.whatsNew, hideAll: v } })} />
          <TableSwitchRow
            label="Hide What's New"
            icon={<TableRow.Icon source={findAssetId("CircleInformationIcon")} />}
            value={!!settingsSections.whatsNew.CHANGE_LOG}
            disabled={!!settingsSections.whatsNew.hideAll}
            onValueChange={v => settingsSections.updateSettings({ whatsNew: { ...settingsSections.whatsNew, CHANGE_LOG: v } })}
          />
        </TableRowGroup>
      </Stack>
    </ReactNative.ScrollView>
  );
}
