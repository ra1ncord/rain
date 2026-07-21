import { findAssetId } from "@api/assets";
import { findByStoreName } from "@metro";
import { Stack, TableRadioGroup, TableRadioRow, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { coolBarSettings, useCoolbarSettings } from "./storage";

export default function CoolbarSettings() {
    const settings = useCoolbarSettings();
    const GuildStore = findByStoreName("GuildStore");
    const guilds = Object.values(GuildStore?.getGuilds?.() || {}) as { id: string; name: string }[];

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Button Visibility">
                    <TableSwitchRow
                        label="Show Favourites Button (Star)"
                        subLabel="Displays a star button next to the notifications bell."
                        value={settings.showStar}
                        onValueChange={(val: boolean) => (coolBarSettings.showStar = val)}
                        icon={<TableRow.Icon source={findAssetId("StarIcon")} />}
                    />
                    <TableSwitchRow
                        label="Show Settings Button"
                        subLabel="Displays a settings button next to the notifications bell."
                        value={settings.showSettings}
                        onValueChange={(val: boolean) => (coolBarSettings.showSettings = val)}
                        icon={<TableRow.Icon source={findAssetId("SettingsIcon")} />}
                    />
                </TableRowGroup>

                {settings.showStar && (
                    <TableRadioGroup
                        title="Star Button Target Server"
                        value={settings.targetServerId}
                        onChange={(val: string) => (coolBarSettings.targetServerId = val)}
                    >
                        <TableRadioRow
                            label="Favourites"
                            subLabel="Opens the Favourites server"
                            value="@favorites"
                        />
                        {guilds.map(guild => (
                            <TableRadioRow
                                key={guild.id}
                                label={guild.name}
                                value={guild.id}
                            />
                        ))}
                    </TableRadioGroup>
                )}
            </Stack>
        </ScrollView>
    );
}
