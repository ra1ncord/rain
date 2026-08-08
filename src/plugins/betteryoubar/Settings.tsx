import { findAssetId } from "@api/assets";
import { findByProps, findByStoreName } from "@metro";
import { Stack, TableRadioGroup, TableRadioRow, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import React from "react";
import { Keyboard, ScrollView } from "react-native";

import { betteryoubarSettings, useBetterYouBarSettings } from "./storage";

const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");

export default function Settings() {
    const settings = useBetterYouBarSettings();
    const GuildStore = findByStoreName("GuildStore");
    const guilds = Object.values(GuildStore?.getGuilds?.() || {}) as { id: string; name: string }[];

    // thanks serstars for the keyboard code i yoinked :P
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);

    React.useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", e => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: keyboardHeight + 38 }}
            keyboardShouldPersistTaps="handled"
        >
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Button Visibility">
                    <TableSwitchRow
                        label="Show Favourites Button (Star)"
                        subLabel="Displays a star button next to the notifications bell."
                        value={settings.showStar}
                        onValueChange={(val: boolean) => (betteryoubarSettings.showStar = val)}
                        icon={<TableRow.Icon source={findAssetId("StarIcon")} />}
                    />
                    <TableSwitchRow
                        label="Show Settings Button"
                        subLabel="Displays a settings button next to the notifications bell."
                        value={settings.showSettings}
                        onValueChange={(val: boolean) => (betteryoubarSettings.showSettings = val)}
                        icon={<TableRow.Icon source={findAssetId("SettingsIcon")} />}
                    />
                </TableRowGroup>

                <TableRadioGroup
                    title="YouBar Background Mode"
                    value={settings.backgroundMode}
                    onChange={(val: any) => (betteryoubarSettings.backgroundMode = val)}
                >
                    <TableRadioRow
                        label="Nameplate"
                        subLabel="Your nameplate. Default."
                        value="nameplate"
                    />
                    <TableRadioRow
                        label="Custom Image"
                        subLabel="A custom image URL."
                        value="custom_image"
                    />
                    <TableRadioRow
                        label="None"
                        subLabel="Nothing"
                        value="none"
                    />
                </TableRadioGroup>

                {settings.backgroundMode === "custom_image" && (
                    <TableRowGroup title="YouBar Custom Background">
                        <TextInput
                            style={{ padding: 12, backgroundColor: "#1e1f22", color: "white", borderRadius: 8, margin: 12 }}
                            placeholder="https://example.com/image.png"
                            placeholderTextColor="#80848e"
                            value={settings.customImageUrl}
                            onChange={(text: string) => (betteryoubarSettings.customImageUrl = text)}
                        />
                    </TableRowGroup>
                )}

                {settings.showStar && (
                    <TableRowGroup title="Star Button Target Server">
                        <TableRow
                            label="Target Server"
                            subLabel={settings.targetServerId === "@favorites" ? "Favourites" : guilds.find(g => g.id === settings.targetServerId)?.name || "Favourites"}
                            trailing={<TableRow.Arrow />}
                            onPress={() => {
                                showSimpleActionSheet({
                                    key: "BetterYouBarServerSelect",
                                    header: { title: "Select Target Server" },
                                    options: [
                                        {
                                            label: "Favourites",
                                            isMarked: settings.targetServerId === "@favorites",
                                            onPress: () => {
                                                betteryoubarSettings.targetServerId = "@favorites";
                                                hideActionSheet();
                                            }
                                        },
                                        ...guilds.map(guild => ({
                                            label: guild.name,
                                            isMarked: settings.targetServerId === guild.id,
                                            onPress: () => {
                                                betteryoubarSettings.targetServerId = guild.id;
                                                hideActionSheet();
                                            }
                                        }))
                                    ]
                                });
                            }}
                        />
                    </TableRowGroup>
                )}
            </Stack>
        </ScrollView>
    );
}
