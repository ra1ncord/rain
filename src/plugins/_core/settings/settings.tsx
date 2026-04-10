import { useSettings } from "@api/settings";
import { findByProps } from "@metro";
import { ScrollView } from "react-native";

const {
    Stack,
    TableRadioGroup,
    TableRadioRow,
    TableRowGroup,
    TableSwitchRow,
} = findByProps("TableRow");

const SETTINGS_POSITIONS = [
    { key: "TOP", label: "At the top of the settings page" },
    { key: "ACCOUNT", label: "Above Payment Settings" },
    { key: "APPEARANCE", label: "Above Support Settings" },
];

const INFO_OPTIONS = [
    { key: "PRESS", label: "Open Info on Card Press" },
    { key: "BUTTON", label: "Show Plugin Info Button" },
];

export default function SettingsPage() {
    const { settingsPosition, pluginCard, compactMode, updateSettings } = useSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Display">
                    <TableSwitchRow
                        label="Compact Mode"
                        subLabel="Show plugins and themes in a compact list view"
                        value={compactMode}
                        onValueChange={(value: boolean) => updateSettings({ compactMode: value })}
                    />
                </TableRowGroup>

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

                <TableRadioGroup
                    title="Plugin Card Info"
                    value={pluginCard?.showInfoButton ? "BUTTON" : pluginCard?.openOnPress ? "PRESS" : "NONE"}
                    onChange={(value: string) => updateSettings({
                        pluginCard: {
                            ...pluginCard,
                            showInfoButton: value === "BUTTON",
                            openOnPress: value === "PRESS"
                        }
                    })}
                >
                    {INFO_OPTIONS.map(opt => (
                        <TableRadioRow
                            key={opt.key}
                            label={opt.label}
                            value={opt.key}
                        />
                    ))}
                </TableRadioGroup>
            </Stack>
        </ScrollView>
    );
}
