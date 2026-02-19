import { Stack } from "@metro/common/components";
import { useLetItRainSettings } from "./storage";
import { View, Text, StyleSheet } from "react-native";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";

export default function LetItRainSettings() {
    const { settings, updateSetting } = useLetItRainSettings();

    return (
        <Stack spacing={16}>
            <View style={styles.section}>
                <Text style={styles.label}>Rain Amount ({settings.amount})</Text>
                <SettingsTextInput
                    placeholder="50"
                    value={settings.amount.toString()}
                    onChange={(val) => updateSetting("amount", parseInt(val) || 0)}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Raindrop Size ({settings.size})</Text>
                <SettingsTextInput
                    placeholder="1"
                    value={settings.size.toString()}
                    onChange={(val) => updateSetting("size", parseFloat(val) || 1)}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Transparency (between 0 and 1) ({settings.transparency})</Text>
                <SettingsTextInput
                    placeholder="0.8"
                    value={settings.transparency.toString()}
                    onChange={(val) => updateSetting("transparency", parseFloat(val) || 0.8)}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Speed Multiplier ({settings.speed})</Text>
                <SettingsTextInput
                    placeholder="1"
                    value={settings.speed.toString()}
                    onChange={(val) => updateSetting("speed", parseFloat(val) || 1)}
                />
            </View>
        </Stack>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    label: {
        color: "#FFFFFF",
        marginBottom: 8,
        fontSize: 16,
        fontWeight: "600"
    }
});
