import { Stack, TableRadioGroup, TableRadioRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { GridQualities, useTenorGifSearchSettings } from "./storage";

const labels: Record<string, { label: string; subLabel: string }> = {
    gif: { label: "GIF", subLabel: "Original quality, ~500px — slowest" },
    tinygif: { label: "TinyGIF", subLabel: "Small animated thumbnail, ~200px — default" },
    nanogif: { label: "NanoGIF", subLabel: "Tiny thumbnail, ~100px — fastest" },
};

export default function TenorGifSearchSettings() {
    const { gridQuality, updateSettings } = useTenorGifSearchSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRadioGroup
                    title="Grid Quality"
                    value={gridQuality}
                    onChange={(v: string) => updateSettings({ gridQuality: v })}
                >
                    {GridQualities.map(q => (
                        <TableRadioRow
                            key={q}
                            label={labels[q].label}
                            subLabel={labels[q].subLabel}
                            value={q}
                        />
                    ))}
                </TableRadioGroup>
            </Stack>
        </ScrollView>
    );
}
