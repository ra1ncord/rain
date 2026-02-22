import { findByProps } from "@metro";
import { Stack } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useLetItRainSettings } from "./storage";

const { TextInput, TableRowGroup } = findByProps("TextInput");

export default function LetItRainSettings() {
    const { settings, updateSetting } = useLetItRainSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Rain Amount">
                    <TextInput
                        placeholder="50"
                        value={String(settings.amount)}
                        onChange={(v: string) => updateSetting("amount", parseInt(v) || 0)}
                        keyboardType="numeric"
                        isClearable
                    />
                </TableRowGroup>
                <TableRowGroup title="Raindrop Size">
                    <TextInput
                        placeholder="1"
                        value={String(settings.size)}
                        onChange={(v: string) => updateSetting("size", parseFloat(v) || 1)}
                        keyboardType="numeric"
                        isClearable
                    />
                </TableRowGroup>
                <TableRowGroup title="Transparency">
                    <TextInput
                        placeholder="0.8"
                        value={String(settings.transparency)}
                        onChange={(v: string) => updateSetting("transparency", parseFloat(v) || 0.8)}
                        keyboardType="numeric"
                        isClearable
                    />
                </TableRowGroup>
                <TableRowGroup title="Speed Multiplier">
                    <TextInput
                        placeholder="1"
                        value={String(settings.speed)}
                        onChange={(v: string) => updateSetting("speed", parseFloat(v) || 1)}
                        keyboardType="numeric"
                        isClearable
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
