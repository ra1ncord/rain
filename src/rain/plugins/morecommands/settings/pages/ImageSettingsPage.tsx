import { useMoreCommandsSettings } from "../../storage";
import { ReactNative as RN } from "@metro/common";
import { semanticColors } from "@api/ui/components/color";
import { findAssetId } from "@api/assets";
import { Stack, TableRow, TableSwitchRow, TableRowGroup } from "@metro/common/components";

export default function ImageSettingsPage() {
  const storage = useMoreCommandsSettings();

  return (
    <RN.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
      <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
        <TableRowGroup title="Image Commands">
          <TableSwitchRow
            label="/petpet"
            subLabel="Create pet-pet GIF of a user"
            icon={<TableRow.Icon source={findAssetId("HandRequestSpeakIcon")} />}
            value={storage.enabledCommands.petpet}
            onValueChange={(v) => {
              storage.updateEnabledCommands({ petpet: v });
              storage.setPendingRestart(true);
            }}
          />
        </TableRowGroup>

        <TableRowGroup title="KonoChan Commands">
          <TableSwitchRow
            label="/konoself"
            subLabel="Get random image from KonoChan (private)"
            icon={<TableRow.Icon source={findAssetId("EyeIcon")} />}
            value={storage.enabledCommands.konoself}
            onValueChange={(v) => {
              storage.updateEnabledCommands({ konoself: v });
              storage.setPendingRestart(true);
            }}
          />
          <TableSwitchRow
            label="/konosend"
            subLabel="Send random image from KonoChan to channel"
            icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
            value={storage.enabledCommands.konosend}
            onValueChange={(v) => {
              storage.updateEnabledCommands({ konosend: v });
              storage.setPendingRestart(true);
            }}
          />
        </TableRowGroup>
      </Stack>
    </RN.ScrollView>
  );
}
