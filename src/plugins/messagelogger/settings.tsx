import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Strings } from "@rain/i18n";
import React from "react";
import { ScrollView } from "react-native";

import { useMessageLoggerSettings } from "./storage";

export default function MessageLoggerSettings() {
    const settings = useMessageLoggerSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.DELETED_MESSAGES}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.ENABLE}
                        value={!!settings.deleted?.enabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, enabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.SHOW_TIMESTAMPS}
                        value={!!settings.deleted?.showTimestamps}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, showTimestamps: v } });
                        }}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.USE_12HOURS_FORMAT}
                        value={!!settings.deleted?.use12Hour}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, use12Hour: v } });
                        }}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.SHOW_ONLY_TIMESTAMP}
                        value={!!settings.deleted?.showOnlyTimestamp}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, showOnlyTimestamp: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.EDITED_MESSAGES}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.ENABLED}
                        value={!!settings.edited?.enabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ edited: { ...settings.edited, enabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.SHOW_SEPARATOR}
                        value={!!settings.edited?.showSeparator}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ edited: { ...settings.edited, showSeparator: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.FILTERS}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.IGNORE_BOTS}
                        value={!!settings.filters?.ignoreBots}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ filters: { ...settings.filters, ignoreBots: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.DATABASE}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.MESSAGELOGGER.ENABLE_LOGGING}
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
