import { findAssetId } from "@api/assets";
import { Stack, TableRowGroup, TableRowIcon,TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useQuickDeleteSettings } from "./storage";

const settings = [
    {
        label: "Messages",
        subLabel: "Deletes messages without confirmation",
        icon: "ForumIcon",
        value: "autoConfirmMessage",
    },
    {
        label: "Embeds",
        subLabel: "Deletes embeds without confirmation",
        icon: "EmbedIcon",
        value: "autoConfirmEmbed",
    },
];

export default function QuickDeleteSettings() {
    const store = useQuickDeleteSettings();
    const { autoConfirmMessage, autoConfirmEmbed } = store;

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Settings">
                    {settings.map(
                        ({ label, subLabel, icon, value }) => (
                            <TableSwitchRow
                                key={value}
                                label={label}
                                subLabel={subLabel}
                                icon={<TableRowIcon source={findAssetId(icon)} />}
                                value={value === "autoConfirmMessage" ? autoConfirmMessage : autoConfirmEmbed}
                                onValueChange={(v: boolean) => store.updateSettings({ [value]: v })}
                            />
                        ),
                    )}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
