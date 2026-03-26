import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { findByProps } from "@metro";
import React from "react";
import { ScrollView } from "react-native";

import { useMessageLoggerSettings } from "./storage";
const { Card } = findByProps("Card");

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
                    <TableSwitchRow
                        label="Ignore Self Edits"
                        value={!!settings.filters?.ignoreSelfEdits}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ filters: { ...settings.filters, ignoreSelfEdits: v } });
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Ignore list">
                        <Card>
                            <SettingsTextInput
                                placeholder="Enter a list of IDs to ignore separated by spaces."
                                value={settings.ignoreList}
                                onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ignoreList: v.replaceAll(/[^0-9 ]/g, "")})}
                                isClearable
                            />
                        </Card>  
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

                <TableRowGroup title="Custom Modification Texts">
                    <TableSwitchRow
                        label="Enable Custom Edit Messages"
                        subLabel = "The edit message will separate the modified message and the original message."
                        value={!!settings.customEditTextEnabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ customEditTextEnabled: v });
                        }}
                    />
                    <TableSwitchRow
                        label="Enable Custom Delete Messages"
                        subLabel = "The delete message will appear as a automod message under the deleted message."
                        value={!!settings.customDeleteTextEnabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ customDeleteTextEnabled: v });
                        }}
                    />
                </TableRowGroup>
                {settings.customEditTextEnabled === true && (
                        <TableRowGroup title="Custom Edit Text">
                            <Card>
                                <SettingsTextInput
                                    placeholder="Custom Edit Text Goes here"
                                    value={settings.customEditText}
                                    onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ customEditText: v })}
                                    isClearable
                                />
                            </Card>  
                        </TableRowGroup>                
                )}
                {settings.customDeleteTextEnabled === true && (
                        <TableRowGroup title="Custom Delete Text">
                            <Card>
                                <SettingsTextInput
                                    placeholder="Custom Delete Text Goes here"
                                    value={settings.customDeletedText}
                                    onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ customDeletedText: v })}
                                    isClearable
                                />
                            </Card>  
                        </TableRowGroup>                
                )}
            </Stack>
        </ScrollView>
    );
}
