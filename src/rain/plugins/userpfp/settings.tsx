import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { ScrollView } from "react-native";

import { fetchData } from "./index";

export default function UserPFPSettings() {
    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Info">
                    <TableRow
                        label="Discord Server"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        trailing={TableRow.Arrow}
                        onPress={() => {
                            const { Linking } = require("react-native");
                            Linking.openURL("https://discord.gg/userpfp-1129784704267210844");
                        }}
                    />
                    <TableRow
                        label="Reload DB"
                        icon={<TableRow.Icon source={findAssetId("ic_message_retry")} />}
                        onPress={() => {
                            fetchData();
                            showToast("Reloaded DB", findAssetId("check"));
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
