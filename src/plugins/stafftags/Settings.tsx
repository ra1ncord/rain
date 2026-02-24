import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { View } from "react-native";

import { useStaffTagsSettings } from "./storage";

export default function Settings() {
    const settings = useStaffTagsSettings();

    return (
        <View>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Tag style">
                    <TableSwitchRow
                        label="Use top role color for tag backgrounds"
                        value={!!settings.useRoleColor}
                        onValueChange={v => useStaffTagsSettings.getState().updateSettings({ useRoleColor: v })}
                    />
                </TableRowGroup>
            </Stack>
        </View>
    );
}
