import { useSettings } from "@api/settings";
import { findByProps } from "@metro";
import { ScrollView } from "react-native";
import { Strings } from "@rain/i18n";

const {
    Stack,
    TableRadioGroup,
    TableRadioRow,
} = findByProps("TableRow");

const SETTINGS_POSITIONS = [
    { key: "TOP", label: Strings.PLUGINS.CORE.SETTINGS.RAIN_POSITIONS.TOP },
    { key: "ACCOUNT", label: Strings.PLUGINS.CORE.SETTINGS.RAIN_POSITIONS.ACCOUNT },
    { key: "APPEARANCE", label: Strings.PLUGINS.CORE.SETTINGS.RAIN_POSITIONS.APPEARANCE },
];

const INFO_OPTIONS = [
    { key: "PRESS", label: Strings.PLUGINS.CORE.SETTINGS.INFO_OPTIONS.PRESS },
    { key: "BUTTON", label: Strings.PLUGINS.CORE.SETTINGS.INFO_OPTIONS.BUTTON },
];

export default function SettingsPage() {
    const { settingsPosition, pluginCard, updateSettings } = useSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRadioGroup
                    title={Strings.PLUGINS.CORE.SETTINGS.RAIN_POSITIONS.TITLE}
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
                    title={Strings.PLUGINS.CORE.SETTINGS.INFO_OPTIONS.TITLE}
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
