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
                        icon={<TableRow.Icon source={findAssetId("TagIcon")} />}
                        value={settings.pastelizeAll}
                        onValueChange={(value: boolean) => settings.updateSettings({ pastelizeAll: value })}
                    />
                    <TableSwitchRow
                        label="Pastelize webhooks by display name"
                        subLabel="Otherwise uses the webhook ID"
                        icon={<TableRow.Icon source={findAssetId("WebhookIcon")} />}
                        value={settings.webhookName}
                        onValueChange={(value: boolean) => settings.updateSettings({ webhookName: value })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
