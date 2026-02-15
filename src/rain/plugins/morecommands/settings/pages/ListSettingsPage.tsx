import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { ReactNative as RN } from "@metro/common";
import { Stack, TableRow, TableRowGroup,TableSwitchRow } from "@metro/common/components";

import { useMoreCommandsSettings } from "../../storage";

export default function ListSettingsPage() {
    const storage = useMoreCommandsSettings();

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="List Display Settings">
                    <TableSwitchRow
                        label="Always Send Detailed Plugin List"
                        subLabel="Always use detailed mode when listing plugins"
                        icon={<TableRow.Icon source={findAssetId("PuzzlePieceIcon")} />}
                        value={storage.listSettings.pluginListAlwaysDetailed}
                        onValueChange={(v) => {
                            storage.updateListSettings({ pluginListAlwaysDetailed: v });
                        }}
                    />
                    <TableSwitchRow
                        label="Always Send Detailed Theme List"
                        subLabel="Always use detailed mode when listing themes"
                        icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />}
                        value={storage.listSettings.themeListAlwaysDetailed}
                        onValueChange={(v) => {
                            storage.updateListSettings({ themeListAlwaysDetailed: v });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Available List Commands">
                    <TableSwitchRow
                        label="/plugin-list"
                        subLabel="List all installed plugins"
                        icon={<TableRow.Icon source={findAssetId("PuzzlePieceIcon")} />}
                        value={storage.enabledCommands.pluginList}
                        onValueChange={(v) => {
                            storage.updateEnabledCommands({ pluginList: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/theme-list"
                        subLabel="List all installed themes"
                        icon={<TableRow.Icon source={findAssetId("PaintPaletteIcon")} />}
                        value={storage.enabledCommands.themeList}
                        onValueChange={(v) => {
                            storage.updateEnabledCommands({ themeList: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </RN.ScrollView>
    );
}
