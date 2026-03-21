import { findAssetId } from "@api/assets";
import { Stack, TableRowGroup, TableRowIcon,TableSwitchRow } from "@metro/common/components";
import { Strings } from "@rain/i18n";
import { ScrollView } from "react-native";

import { useQuickDeleteSettings } from "./storage";

const settings = [
    {
        label: Strings.PLUGINS.CUSTOM.QUICKDELETE.MESSAGES,
        subLabel: Strings.PLUGINS.CUSTOM.QUICKDELETE.MESSAGES_DESC,
        icon: "ForumIcon",
        value: "autoConfirmMessage",
    },
    {
        label: Strings.PLUGINS.CUSTOM.QUICKDELETE.EMBEDS,
        subLabel: Strings.PLUGINS.CUSTOM.QUICKDELETE.EMBEDS_DESC,
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
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.QUICKDELETE.SETTINGS}>
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
