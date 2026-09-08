import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { findByProps } from "@metro";
import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useAnonymizeSettings } from "./storage";

const { Card } = findByProps("Card");

export default () => {
    const settings = useAnonymizeSettings();
    const { updateSettings } = settings;

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                <TableRowGroup title="Filename">
                    <TableSwitchRow
                        label="Use a custom name"
                        subLabel="If off, files get a random name"
                        value={settings.useCustomName}
                        onValueChange={(v: boolean) => updateSettings({ useCustomName: v })}
                    />
                    {settings.useCustomName && (
                        <Card>
                            <SettingsTextInput
                                placeholder="Custom filename"
                                value={settings.customName}
                                onChange={(v: string) => updateSettings({ customName: v })}
                                isClearable
                            />
                        </Card>
                    )}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};
