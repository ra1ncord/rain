import { findAssetId } from "@api/assets";
import update from "@api/native/modules/update";
import { showToast } from "@api/ui/toasts";
import { Stack, TableRadioGroup, TableRadioRow, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { useDeclutterSettings } from "./storage";
import { paymentOptions, profileOptions } from "./surfaces";

export default function DeclutterSettings() {
    const settings = useDeclutterSettings();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);

    const updateHide = (key: keyof typeof settings.hide, value: boolean) => {
        useDeclutterSettings.getState().updateSettings({
            hide: {
                ...settings.hide,
                [key]: value
            }
        });
        forceUpdate();
    };

    const updateShow = (key: keyof typeof settings.show, value: boolean) => {
        useDeclutterSettings.getState().updateSettings({
            show: {
                ...settings.show,
                [key]: value
            }
        });
        forceUpdate();
    };

    const updateDismiss = (key: keyof typeof settings.dismiss, value: boolean) => {
        useDeclutterSettings.getState().updateSettings({
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
                <TableRow
                    label="Reload Rain"
                    subLabel="Apply changes to open lists and profiles."
                    onPress={async () => {
                        try {
                            await update.nativeReload();
                        } catch {
                            showToast("Unable to reload Rain");
                        }
                    }}
                />
                <TableRowGroup title="Servers and Direct Messages">
                    <TableSwitchRow
                        label="Hide server boost goal"
                        subLabel="Remove the boost goal from server channel lists."
                        value={settings.hideServerBoostGoal}
                        onValueChange={value => settings.updateSettings({ hideServerBoostGoal: value })}
                    />
                    <TableSwitchRow
                        label="Hide DM activity cards"
                        subLabel="Remove activity cards from the Direct Messages page."
                        value={settings.hideDmActivityCards}
                        onValueChange={value => settings.updateSettings({ hideDmActivityCards: value })}
                    />
                </TableRowGroup>

                <TableRowGroup title="Profiles">
                    {profileOptions.map(([key, label]) => (
                        <TableSwitchRow
                            key={key}
                            label={label}
                            value={settings[key]}
                            onValueChange={value => settings.updateSettings({ [key]: value })}
                        />
                    ))}
                </TableRowGroup>

                <TableRowGroup title="Payment Settings">
                    <TableSwitchRow
                        label="Hide all payment settings"
                        subLabel="Turn off to choose individual entries below."
                        value={settings.hidePaymentSettings}
                        onValueChange={value => settings.updateSettings({ hidePaymentSettings: value })}
                    />
                    {paymentOptions.map(([key, label]) => (
                        <TableSwitchRow
                            key={key}
                            label={"Hide " + label}
                            disabled={settings.hidePaymentSettings}
                            value={settings.hidePaymentSettings || settings[key]}
                            onValueChange={value => settings.updateSettings({ [key]: value })}
                        />
                    ))}
                </TableRowGroup>

                <TableRowGroup title="Hide Action Buttons">
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("GameControllerIcon")} />}
                        label="Hide Apps & Commands"
                        value={settings.hide.app}
                        onValueChange={v => updateHide("app", v)}
                    />
                    <TableSwitchRow
                        icon={<TableRow.Icon source={findAssetId("GiftIcon")} />}
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
