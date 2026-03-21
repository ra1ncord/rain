import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Strings } from "@rain/i18n";
import { View } from "react-native";

import { useStaffTagsSettings } from "./storage";

export default function Settings() {
    const settings = useStaffTagsSettings();

    return (
        <View>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.STAFFTAGS.TAG_STYLE}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.STAFFTAGS.TAG_STYLE_DESC}
                        value={!!settings.useRoleColor}
                        onValueChange={v => useStaffTagsSettings.getState().updateSettings({ useRoleColor: v })}
                    />
                </TableRowGroup>
            </Stack>
        </View>
    );
}
