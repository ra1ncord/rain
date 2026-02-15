import { useSettings } from "@api/settings";
import { findByProps } from "@metro";
import { ScrollView } from "react-native";

const {
    Stack,
    TableRadioGroup,
    TableRadioRow,
} = findByProps("TableRow");

const SETTINGS_POSITIONS = [
    { key: "TOP", label: "At the top of the settings page" },
    { key: "ACCOUNT", label: "Above Payment Settings" },
    { key: "APPEARANCE", label: "Above Support Settings" },
];

export default function SettingsPage() {
    const { settingsPosition, updateSettings } = useSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRadioGroup
                    title="Settings Position"
                    titleStyle={{ marginTop: 5 }}
                    value={settingsPosition ?? "TOP"}
                    onChange={(value: string) => updateSettings({ settingsPosition: value })}
                >
                    {SETTINGS_POSITIONS.map(pos => (
                        <TableRadioRow
                            key={pos.key}
                            label={pos.label}
                            value={pos.key}
                        />
                    ))}
                </TableRadioGroup>
            </Stack>
        </ScrollView>
    );
}
