import { findAssetId } from "@api/assets";
import { Stack, TableRadioGroup, TableRadioRow, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { useBetterChatButtonsSettings } from "./storage";

export default function BetterChatButtonsSettings() {
    const settings = useBetterChatButtonsSettings();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);

    const updateHide = (key: keyof typeof settings.hide, value: boolean) => {
        useBetterChatButtonsSettings.getState().updateSettings({
            hide: {
                ...settings.hide,
                [key]: value
            }
        });
        forceUpdate();
    };

    const updateShow = (key: keyof typeof settings.show, value: boolean) => {
        useBetterChatButtonsSettings.getState().updateSettings({
            show: {
                ...settings.show,
                [key]: value
            }
        });
        forceUpdate();
    };

    const updateDismiss = (key: keyof typeof settings.dismiss, value: boolean) => {
        useBetterChatButtonsSettings.getState().updateSettings({
            dismiss: {
                ...settings.dismiss,
                [key]: value
            }
        });
        forceUpdate();
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Hide Action Buttons">
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("GameControllerIcon")} />}
                        label="Hide Apps & Commands"
                        value={settings.hide.app}
                        onValueChange={v => updateHide("app", v)}
                    />
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("ic_gift")} />}
                        label="Hide Gift"
                        value={settings.hide.gift}
                        onValueChange={v => updateHide("gift", v)}
                    />
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("ThreadPlusIcon")} />}
                        label="Hide New Thread"
                        disabled={settings.show.thread}
                        value={settings.show.thread ? false : settings.hide.thread}
                        onValueChange={v => updateHide("thread", v)}
                    />
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("MicrophoneIcon")} />}
                        label="Hide Voice Message"
                        value={settings.hide.voice}
                        onValueChange={v => updateHide("voice", v)}
                    />
                </TableRowGroup>

                <TableRowGroup title="Force Show Buttons">
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("ThreadPlusIcon")} />}
                        label="Force show New Thread button"
                        subLabel="Show the thread button even when you can't start threads, or when the chat input is not focused"
                        value={settings.show.thread}
                        onValueChange={v => updateShow("thread", v)}
                    />
                </TableRowGroup>

                <TableRadioGroup
                    title="Action Buttons Collapse Behavior"
                    value={settings.dismiss.actions.toString()}
                    onChange={(v: string) => updateDismiss("actions", v === "true")}
                >
                    <TableRadioRow label="Never collapse" value="false" />
                    <TableRadioRow
                        label="Collapse while typing"
                        subLabel="Collapse action buttons when you start typing."
                        value="true"
                    />
                </TableRadioGroup>

                <TableRadioGroup
                    title="Send Button Collapse Behavior"
                    value={settings.dismiss.send.toString()}
                    onChange={(v: string) => updateDismiss("send", v === "true")}
                >
                    <TableRadioRow label="Never collapse" value="false" />
                    <TableRadioRow
                        label="Collapse when no text"
                        subLabel="Collapse the Send button when the message box is empty."
                        value="true"
                    />
                </TableRadioGroup>
            </Stack>
        </ScrollView>
    );
}
