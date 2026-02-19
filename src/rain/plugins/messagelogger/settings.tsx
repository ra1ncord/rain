import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { useMessageLoggerSettings } from "./storage";

export default function MessageLoggerSettings() {
    const settings = useMessageLoggerSettings();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Settings">
                    <TableSwitchRow
                        label="Show the time of deletion"
                        value={!!settings.timestamps}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ timestamps: v });
                            forceUpdate();
                        }}
                    />
                    <TableSwitchRow
                        label="Use 12-hour format"
                        value={!!settings.ew}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ ew: v });
                            forceUpdate();
                        }}
                    />
                    <TableSwitchRow
                        label="Only show timestamps (no content)"
                        value={!!settings.onlyTimestamps}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ onlyTimestamps: v });
                            forceUpdate();
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Filters">
                    <TableSwitchRow
                        label="Ignore bots"
                        value={!!settings.ignore.bots}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ ignore: { ...settings.ignore, bots: v } });
                            forceUpdate();
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
