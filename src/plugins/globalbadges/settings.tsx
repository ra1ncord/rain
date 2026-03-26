import { ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Strings } from "@rain/i18n";
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
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.BADGE_DISPLAY}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.LOAD_BADGES_ON_LEFT}
                        subLabel={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.LOAD_BADGES_ON_LEFT_DESC}
                        value={!!settings.left}
                        onValueChange={v => useCustomBadgesSettings.getState().updateSettings({ left: v })}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.DISABLE_MOD_BADGES}
                        subLabel={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.DISABLE_MOD_BADGES_DESC}
                        value={!!settings.mods}
                        onValueChange={v => useCustomBadgesSettings.getState().updateSettings({ mods: v })}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.DISABLE_CUSTOM_BADGES}
                        subLabel={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.DISABLE_CUSTOM_BADGES_DESC}
                        value={!!settings.customs}
                        onValueChange={v => useCustomBadgesSettings.getState().updateSettings({ customs: v })}
                    />
                    <TableRow
                        label={Strings.PLUGINS.CUSTOM.GLOBALBADGES.SETTINGS.ADD_CUSTOM_BADGE}
                        arrow={true}
                        onPress={openDiscord}
                    />
                </TableRowGroup>
            </Stack>
        </View>
    );
}
