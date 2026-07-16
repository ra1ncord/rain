import { findAssetId } from "@api/assets";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { usePastelizeSettings } from "./storage";

export default function PastelizeSettings() {
    const settings = usePastelizeSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Pastelize">
                    <TableSwitchRow
                        label="Pastelize all"
                        subLabel="Ignores checking for no role"
                        icon={<TableRow.Icon source={findAssetId("ic_tag")} variant="blurple" />}
                        value={settings.pastelizeAll}
                        onValueChange={(value: boolean) => settings.updateSettings({ pastelizeAll: value })}
                    />
                    <TableSwitchRow
                        label="Pastelize webhooks by display name"
                        subLabel="Otherwise uses the webhook ID"
                        icon={<TableRow.Icon source={findAssetId("ic_webhook_24px")} variant="blurple" />}
                        value={settings.webhookName}
                        onValueChange={(value: boolean) => settings.updateSettings({ webhookName: value })}
                    />
                    <TableSwitchRow
                        label="Pastelize message content"
                        subLabel="Use RoleColorEverywhere for coloring if not using Pastelize All. Same caveats with tapping message content apply."
                        icon={<TableRow.Icon source={findAssetId("ic_messages")} variant="blurple" />}
                        value={settings.pastelizeContent}
                        onValueChange={(value: boolean) => settings.updateSettings({ pastelizeContent: value })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
