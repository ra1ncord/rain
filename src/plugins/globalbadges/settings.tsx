import { ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { View } from "react-native";

import { useCustomBadgesSettings } from "./storage";

export default function CustomBadgesSettings() {
    const settings = useCustomBadgesSettings();

    const openDiscord = () => {
        const url = ReactNative.Linking;
        if (url?.openURL) {
            url.openURL("https://discord.gg/eTvYv95PCG");
        }
    };

    return (
        <View>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Badge Display">
                    <TableSwitchRow
                        label="Load Badges on left"
                        subLabel="If enabled, custom badges will load up first than the original badges."
                        value={!!settings.left}
                        onValueChange={v => useCustomBadgesSettings.getState().updateSettings({ left: v })}
                    />
                    <TableSwitchRow
                        label="Disable Mod Badges"
                        subLabel="If enabled, it will disable mod client badges but not custom badges."
                        value={!!settings.mods}
                        onValueChange={v => useCustomBadgesSettings.getState().updateSettings({ mods: v })}
                    />
                    <TableSwitchRow
                        label="Disable Custom Badges"
                        subLabel="If enabled, it will disable custom badges but not mod client badges."
                        value={!!settings.customs}
                        onValueChange={v => useCustomBadgesSettings.getState().updateSettings({ customs: v })}
                    />
                    <TableRow
                        label="Add Custom badges (not affiliated)"
                        arrow={true}
                        onPress={openDiscord}
                    />
                </TableRowGroup>
            </Stack>
        </View>
    );
}
