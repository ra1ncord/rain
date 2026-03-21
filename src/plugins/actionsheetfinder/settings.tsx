import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { Stack, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { findByProps } from "@metro/wrappers";
import React, { useMemo,useState } from "react";
import { ScrollView, View } from "react-native";

import { clearLogs,useActionSheetFinderSettings } from "./storage";

const { Card: CardComponent } = findByProps("Card");

const LOG_COLORS = [
    semanticColors.CARD_SECONDARY_BG,
    semanticColors.CARD_PRIMARY_BG,
];

export default function ActionSheetFinderSettings() {
    const settings = useActionSheetFinderSettings();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLogs = useMemo(() => {
        const logs = settings.logs.slice().reverse();
        if (!searchQuery) return logs;
        return logs.filter(log => log.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [settings.logs, searchQuery]);

    const renderLogCard = (log: string, index: number) => (
        <CardComponent
            key={index}
            style={{
                marginBottom: 8,
                backgroundColor: LOG_COLORS[index % LOG_COLORS.length]
            }}
        >
            <Text variant="text-md/semibold" selectable>
                {log}
            </Text>
        </CardComponent>
    );

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Logs">
                    <TableRow
                        label="Clear Logs"
                        onPress={() => clearLogs()}
                        icon={<TableRow.Icon source={findAssetId("TrashIcon")} />}
                    />
                </TableRowGroup>
                <CardComponent>
                    <Stack spacing={8}>
                        <Text variant="heading-md/semibold">Recent Logs</Text>
                        <SettingsTextInput
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                        <Stack spacing={8}>
                            {filteredLogs.length === 0 ? (
                                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                                    <TableRow.Icon source={findAssetId("WarningIcon")} style={{ width: 48, height: 48, opacity: 0.5, marginBottom: 8 }} />
                                    <Text variant="heading-md/extabold" color="text-muted" style={{ textAlign: "center" }}>
                                        {searchQuery ? "No matching logs found." : "No logs yet.\nPress an action sheet to see its key here."}
                                    </Text>
                                </View>
                            ) : (
                                filteredLogs.map((log, index) => renderLogCard(log, index))
                            )}
                        </Stack>
                    </Stack>
                </CardComponent>
            </Stack>
        </ScrollView>
    );
}
