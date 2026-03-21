import { findByProps } from "@metro";
import { Strings } from "@rain/i18n";
import { ScrollView } from "react-native";

import { useMoyaiSettings } from "./storage";

const { TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Stack } = findByProps("Stack");

export default function MoyaiSettings() {
    const settings = useMoyaiSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.MOYAI.BEHAVIOR}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MOYAI.PLAY_ON_REACTIONS}
                        onValueChange={(value: boolean) => {
                            settings.updateSettings({ allowReactions: value });
                        }}
                        value={settings.allowReactions}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
