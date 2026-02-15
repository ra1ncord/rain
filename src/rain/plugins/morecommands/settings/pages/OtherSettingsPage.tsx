import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { ReactNative as RN } from "@metro/common";
import { Stack, TableRow, TableRowGroup,TableSwitchRow } from "@metro/common/components";

import { useMoreCommandsSettings } from "../../storage";

export default function OtherSettingsPage() {
    const storage = useMoreCommandsSettings();

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Message Commands">
                    <TableSwitchRow
                        label="/firstmessage"
                        subLabel="Get the first message in a channel"
                        icon={<TableRow.Icon source={findAssetId("ChatIcon")} />}
                        value={storage.enabledCommands.firstmessage}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ firstmessage: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="System Commands">
                    <TableSwitchRow
                        label="/sysinfo"
                        subLabel="Display system information"
                        icon={<TableRow.Icon source={findAssetId("SettingsIcon")} />}
                        value={storage.enabledCommands.sysinfo}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ sysinfo: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Friend Invites">
                    <TableSwitchRow
                        label="/invite create"
                        subLabel="Generate a friend invite link"
                        icon={<TableRow.Icon source={findAssetId("UserPlusIcon")} />}
                        value={storage.enabledCommands.friendInviteCreate}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ friendInviteCreate: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/view invites"
                        subLabel="View your current friend invites"
                        icon={<TableRow.Icon source={findAssetId("UserCheckIcon")} />}
                        value={storage.enabledCommands.friendInviteView}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ friendInviteView: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/revoke invites"
                        subLabel="Revoke all your friend invites"
                        icon={<TableRow.Icon source={findAssetId("UserMinusIcon")} />}
                        value={storage.enabledCommands.friendInviteRevoke}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ friendInviteRevoke: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </RN.ScrollView>
    );
}
