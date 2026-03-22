import { hideSheet, showSheet } from "@api/ui/sheets";
import { findByProps } from "@metro";
import { constants, ReactNative as RN } from "@metro/common";
import { ActionSheet, Text, TextInput } from "@metro/common/components";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { GuildStore, PermissionsStore } from "../../modules";
import AddToServerRow from "../components/AddToServerRow";

const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton");
const { TableRowGroup } = findByProps("TableRow");

function AddToServerContent({ emoji }: { emoji: { id: string; name: string; animated?: boolean; src?: string; alt?: string } }) {
    const permConstants = constants.Permissions;
    const permission = permConstants?.CREATE_GUILD_EXPRESSIONS;
    const [emojiName, setEmojiName] = useState(emoji.alt ?? emoji.name ?? "emoji");

    const guildsRaw = GuildStore?.getGuilds?.() ?? {};
    const guilds = Object.values(guildsRaw)
        .filter((guild: any) => PermissionsStore?.can(permission, guild))
        .sort((a: any, b: any) => a.name?.localeCompare?.(b.name));

    return (
        <ActionSheet>
            <ScrollView contentContainerStyle={{ gap: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16 }}>
                    <RN.Image
                        source={{ uri: emoji.src }}
                        style={{ width: 32, height: 32, borderRadius: 4 }}
                    />
                    <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>Add Emoji</Text>
                    <ActionSheetCloseButton onPress={() => hideSheet("AddToServerActionSheet")} />
                </View>
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                    <TextInput
                        size="md"
                        value={emojiName}
                        onChange={setEmojiName}
                        placeholder="Emoji name"
                    />
                </View>
                {guilds.length === 0 ? (
                    <View style={{ padding: 16 }}>
                        <Text variant="text-md/medium">No servers available.</Text>
                    </View>
                ) : (
                    <TableRowGroup>
                        {guilds.map((guild: any) => (
                            <AddToServerRow key={guild.id} guild={guild} emoji={emoji} emojiName={emojiName} />
                        ))}
                    </TableRowGroup>
                )}
            </ScrollView>
        </ActionSheet>
    );
}

export function showAddToServerActionSheet(emoji: { id: string; name: string; animated?: boolean; src?: string; alt?: string }) {
    showSheet("AddToServerActionSheet", AddToServerContent, { emoji });
}
