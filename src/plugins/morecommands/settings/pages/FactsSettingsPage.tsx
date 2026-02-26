import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { ReactNative as RN } from "@metro/common";
import { Stack, TableRow, TableRowGroup,TableSwitchRow } from "@metro/common/components";

import { useMoreCommandsSettings } from "../../storage";

export default function FactsSettingsPage() {
    const storage = useMoreCommandsSettings();

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Fact Display Settings">
                    <TableSwitchRow
                        label="Send as Reply"
                        subLabel="Send facts as a reply to the command message"
                        icon={<TableRow.Icon source={findAssetId("ArrowAngleLeftUpIcon")} />}
                        value={storage.factSettings.sendAsReply}
                        onValueChange={v => {
                            storage.updateFactSettings({ sendAsReply: v });
                        }}
                    />
                    <TableSwitchRow
                        label="Include Source Citation"
                        subLabel="Include the source of facts when available"
                        icon={<TableRow.Icon source={findAssetId("LinkIcon")} />}
                        value={storage.factSettings.includeCitation}
                        onValueChange={v => {
                            storage.updateFactSettings({ includeCitation: v });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Available Fact Commands">
                    <TableSwitchRow
                        label="/catfact"
                        subLabel="Get random cat facts"
                        icon={<TableRow.Icon source={findAssetId("BookCheckIcon")} />}
                        value={storage.enabledCommands.catfact}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ catfact: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/dogfact"
                        subLabel="Get random dog facts"
                        icon={<TableRow.Icon source={findAssetId("BookCheckIcon")} />}
                        value={storage.enabledCommands.dogfact}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ dogfact: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/useless"
                        subLabel="Get random useless facts"
                        icon={<TableRow.Icon source={findAssetId("BookCheckIcon")} />}
                        value={storage.enabledCommands.useless}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ useless: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </RN.ScrollView>
    );
}
