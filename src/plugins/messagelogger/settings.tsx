import { findAssetId } from "@api/assets";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { findByProps } from "@metro";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";
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
                        icon={<TableRow.Icon source={findAssetId("ic_eye_hidden")} />}
                        value={!!settings.deleted?.enabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, enabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Show Timestamps"
                        icon={<TableRow.Icon source={findAssetId("ic_clock")} />}
                        value={!!settings.deleted?.showTimestamps}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, showTimestamps: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Use 12-Hour Format"
                        icon={<TableRow.Icon source={findAssetId("ic_clock")} />}
                        value={!!settings.deleted?.use12Hour}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, use12Hour: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Show Only Timestamp"
                        icon={<TableRow.Icon source={findAssetId("ic_clock")} />}
                        value={!!settings.deleted?.showOnlyTimestamp}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ deleted: { ...settings.deleted, showOnlyTimestamp: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Edited Messages">
                    <TableSwitchRow
                        label="Enable"
                        icon={<TableRow.Icon source={findAssetId("ic_eye_hidden")} />}
                        value={!!settings.edited?.enabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ edited: { ...settings.edited, enabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Show Separator"
                        icon={<TableRow.Icon source={findAssetId("MoreVerticalIcon")} />}
                        value={!!settings.edited?.showSeparator}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ edited: { ...settings.edited, showSeparator: v } });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Filters">
                    <TableSwitchRow
                        label="Ignore Bots"
                        icon={<TableRow.Icon source={findAssetId("ic_close")} />}
                        value={!!settings.filters?.ignoreBots}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ filters: { ...settings.filters, ignoreBots: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Ignore Self Edits"
                        icon={<TableRow.Icon source={findAssetId("ic_close")} />}
                        value={!!settings.filters?.ignoreSelfEdits}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ filters: { ...settings.filters, ignoreSelfEdits: v } });
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="User ignore list">
                    <Card>
                        <SettingsTextInput
                            placeholder="Enter a list of IDs to ignore separated by spaces."
                            value={settings.ignoreLists.user}
                            onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ ignoreLists: { ...settings.ignoreLists, user: v.replaceAll(/[^0-9 ]/g, "") } })}
                            isClearable
                        />
                    </Card>
                </TableRowGroup>
                <TableRowGroup title="Channel ignore list">
                    <Card>
                        <SettingsTextInput
                            placeholder="Enter a list of Channel IDs to ignore separated by spaces."
                            value={settings.ignoreLists.channel}
                            onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ ignoreLists: { ...settings.ignoreLists, channel: v.replaceAll(/[^0-9 ]/g, "") } })}
                            isClearable
                        />
                    </Card>
                </TableRowGroup>
                <TableRowGroup title="Database">
                    <TableSwitchRow
                        label="Enable Logging"
                        icon={<TableRow.Icon source={findAssetId("ic_download_24px")} />}
                        value={!!settings.databaseLogging}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ databaseLogging: v });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Custom Modification Texts">
                    <TableSwitchRow
                        label="Enable Custom Edit Messages"
                        icon={<TableRow.Icon source={findAssetId("ic_overflow_android")} />}
                        subLabel = "The edit message will separate the modified message and the original message."
                        value={!!settings.custom.customEditTextEnabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ custom: { ...settings.custom, customEditTextEnabled: v } });
                        }}
                    />
                    <TableSwitchRow
                        label="Enable Custom Delete Messages"
                        icon={<TableRow.Icon source={findAssetId("ic_overflow_android")} />}
                        subLabel = "The delete message will appear as a automod message under the deleted message."
                        value={!!settings.custom.customDeleteTextEnabled}
                        onValueChange={v => {
                            useMessageLoggerSettings.getState().updateSettings({ custom: { ...settings.custom, customDeleteTextEnabled: v } });
                        }}
                    />
                </TableRowGroup>
                {settings.custom.customEditTextEnabled === true && (
                    <TableRowGroup title="Custom Edit Text">
                        <Card>
                            <SettingsTextInput
                                placeholder="Custom Edit Text Goes here"
                                value={settings.custom.customEditText}
                                onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ custom: { ...settings.custom, customEditText: v } })}
                                isClearable
                            />
                        </Card>
                    </TableRowGroup>
                )}
                {settings.custom.customDeleteTextEnabled === true && (
                    <TableRowGroup title="Custom Delete Text">
                        <Card>
                            <SettingsTextInput
                                placeholder="Custom Delete Text Goes here"
                                value={settings.custom.customDeletedText}
                                onChange={(v: string) => useMessageLoggerSettings.getState().updateSettings({ custom: { ...settings.custom, customDeletedText: v } })}
                                isClearable
                            />
                        </Card>
                    </TableRowGroup>
                )}
            </Stack>
        </ScrollView>
    );
}
