import { findAssetId } from "@api/assets";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { coolBarSettings, useCoolBarSettings } from "./storage";

export default function CoolbarSettings() {
    const settings = useCoolBarSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Cool Buttons">
                    <TableSwitchRow
                        label="Favourites Server"
                        subLabel="Displays a button next to the notifications bell that serves as a Favourites server shortcut"
                        value={settings.showStar}
                        onValueChange={(val: boolean) => (coolBarSettings.showStar = val)}
                        icon={<TableRow.Icon source={findAssetId("StarIcon")} />}
                    />
                    <TableSwitchRow
                        label="Settings"
                        subLabel="Displays a settings button next to the notifications bell."
                        value={settings.showSettings}
                        onValueChange={(val: boolean) => (coolBarSettings.showSettings = val)}
                        icon={<TableRow.Icon source={findAssetId("SettingsIcon")} />}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
