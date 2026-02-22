import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { useMessageLoggerSettings } from "./storage";

export default function MessageLoggerSettings() {
    const settings = useMessageLoggerSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Deleted Messages">
                    <TableSwitchRow
                        label="Enable"
                        value={!!settings.deleted?.enabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, enabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Show Timestamps"
                        value={!!settings.deleted?.showTimestamps}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, showTimestamps: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Use 12-Hour Format"
                        value={!!settings.deleted?.use12Hour}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, use12Hour: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Show Only Timestamp"
                        value={!!settings.deleted?.showOnlyTimestamp}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, showOnlyTimestamp: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Edited Messages">
                    <TableSwitchRow
                        label="Enable"
                        value={!!settings.edited?.enabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ edited: { ...settings.edited, enabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Show Separator"
                        value={!!settings.edited?.showSeparator}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ edited: { ...settings.edited, showSeparator: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Filters">
                    <TableSwitchRow
                        label="Ignore Bots"
                        value={!!settings.filters?.ignoreBots}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ filters: { ...settings.filters, ignoreBots: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Database">
                    <TableSwitchRow
                        label="Enable Logging"
                        value={!!settings.databaseLogging}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ databaseLogging: v });
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
