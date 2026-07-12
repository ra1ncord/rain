import { findAssetId } from "@api/assets";
import { Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import { ScrollView } from "react-native";

import { DEFAULT_WATERMARK, useQuoterSettings } from "../storage";

export default function Settings() {
    const settings = useQuoterSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Rendering">
                    <TableSwitchRow
                        label="Grayscale"
                        subLabel="Render the avatar in black and white"
                        icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
                        value={Boolean(settings.grayscale)}
                        onValueChange={(value: boolean) => settings.updateSettings({ grayscale: value })}
                    />
                    <TableSwitchRow
                        label="Show Watermark"
                        subLabel="Draw watermark text in the bottom-right corner"
                        icon={<TableRow.Icon source={findAssetId("PencilIcon")} />}
                        value={Boolean(settings.showWatermark)}
                        onValueChange={(value: boolean) => settings.updateSettings({ showWatermark: value })}
                    />
                </TableRowGroup>
                {settings.showWatermark ? (
                    <TextInput
                        label="Watermark Text"
                        description="Only used when watermark is enabled. Max 32 characters."
                        placeholder={DEFAULT_WATERMARK}
                        size="md"
                        maxLength={32}
                        value={String(settings.watermark ?? "")}
                        onChange={(value: string) => settings.updateSettings({ watermark: value })}
                    />
                ) : null}
            </Stack>
        </ScrollView>
    );
}
