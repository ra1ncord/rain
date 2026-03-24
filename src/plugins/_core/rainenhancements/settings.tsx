import { findByProps } from "@metro";
import { ScrollView } from "react-native";
import { Strings } from "@rain/i18n";

import { useRainEnhancementsSettings } from "./storage";

const {
    TableSwitchRow,
    TableRowGroup,
} = findByProps("TableRow");
const { Stack } = findByProps("Stack");

export default () => {
    const settings = useRainEnhancementsSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack
                style={{ paddingVertical: 24, paddingHorizontal: 12 }}
                spacing={24}
            >
                <TableRowGroup title={Strings.PLUGINS.CORE.RAINENHANCEMENTS.REALMOJI }titleStyleType="no_border">
                    <TableSwitchRow
                        label={Strings.PLUGINS.CORE.RAINENHANCEMENTS.REALMOJI_DESC}
                        onValueChange={(v: boolean) => {
                            settings.updateSettings({ transformEmoji: v });
                        }}
                        value={settings.transformEmoji ?? true}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CORE.RAINENHANCEMENTS.REALSTICKER_DESC}
                        onValueChange={(v: boolean) => {
                            settings.updateSettings({ transformSticker: v });
                        }}
                        value={settings.transformSticker ?? true}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};
