import { React, ReactNative } from "@metro/common";
import { TableRowGroup, TableSwitchRow, Stack, TableRow } from "@metro/common/components";
import { semanticColors } from "@api/ui/components/color";
import { useSettingsSections } from "../../storage";
import { findAssetId } from "@api/assets";

export default function DeveloperSettingsPage() {
  const settingsSections = useSettingsSections();
  return (
    <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
      <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
        <TableRowGroup title="Developer Settings">
          <TableSwitchRow label="Hide All" value={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, hideAll: v } })} />
          <TableSwitchRow label="Hide App Version" icon={<TableRow.Icon source={findAssetId("Discord")} />} value={!!settingsSections.developerSettings.APP_VERSION} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, APP_VERSION: v } })} />
          <TableSwitchRow label="Hide Device Info" icon={<TableRow.Icon source={findAssetId("MobilePhoneSettingsIcon")} />} value={!!settingsSections.developerSettings.DEVICE_INFO} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, DEVICE_INFO: v } })} />
          <TableSwitchRow label="Hide Copy Client Info" icon={<TableRow.Icon source={findAssetId("ClipboardListIcon")} />} value={!!settingsSections.developerSettings.COPY_CLIENT_INFO} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, COPY_CLIENT_INFO: v } })} />
          <TableSwitchRow label="Hide View Debug Logs" icon={<TableRow.Icon source={findAssetId("ChannelListMagnifyingGlassIcon")} />} value={!!settingsSections.developerSettings.VIEW_DEBUG_LOGS} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, VIEW_DEBUG_LOGS: v } })} />
          <TableSwitchRow label="Hide Cache Actions" icon={<TableRow.Icon source={findAssetId("FileWarningIcon")} />} value={!!settingsSections.developerSettings.CACHE_ACTIONS} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, CACHE_ACTIONS: v } })} />
          <TableSwitchRow label="Hide React Compiler" value={!!settingsSections.developerSettings.REACT_COMPILER} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, REACT_COMPILER: v } })} />
          <TableSwitchRow label="Hide Upload Intl Data" icon={<TableRow.Icon source={findAssetId("FileUpIcon")} />} value={!!settingsSections.developerSettings.UPLOAD_INTL_DATA} disabled={!!settingsSections.developerSettings.hideAll} onValueChange={v => settingsSections.updateSettings({ developerSettings: { ...settingsSections.developerSettings, UPLOAD_INTL_DATA: v } })} />
        </TableRowGroup>
      </Stack>
    </ReactNative.ScrollView>
  );
}
