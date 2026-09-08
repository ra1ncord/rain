import update from "@api/native/modules/update";
import { showToast } from "@api/ui/toasts";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { useDeclutterSettings } from "./storage";
import { paymentOptions, profileOptions } from "./surfaces";

export default function DeclutterSettings() {
    const settings = useDeclutterSettings();
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
            </Stack>
        </ScrollView>
    );
}
