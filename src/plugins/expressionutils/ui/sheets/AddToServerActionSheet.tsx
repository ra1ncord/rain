import { hideSheet, showSheet } from "@api/ui/sheets";
import { findByProps } from "@metro";
import { constants, ReactNative as RN } from "@metro/common";
import { ActionSheet, Text } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { GuildStore, PermissionsStore } from "../../modules";
import AddToServerRow from "../components/AddToServerRow";

const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton");

function AddToServerContent({ emoji }: { emoji: { id: string; name: string; animated?: boolean; src?: string; alt?: string } }) {
    const permConstants = constants.Permissions;
    const permission = permConstants?.MANAGE_GUILD_EXPRESSIONS;
    const emojiName = emoji.alt ?? emoji.name ?? "emoji";

    const guildsRaw = GuildStore?.getGuilds?.() ?? {};
    const guilds = Object.values(guildsRaw)
        .filter((guild: any) => PermissionsStore?.can(permission, guild))
        .sort((a: any, b: any) => a.name?.localeCompare?.(b.name));

    return (
        <ActionSheet>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 16 }}>
                <RN.Image
                    source={{ uri: emoji.src }}
                    style={{ width: 32, height: 32, borderRadius: 4 }}
                />
                <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>Stealing "{emojiName}"</Text>
                <ActionSheetCloseButton onPress={() => hideSheet("AddToServerActionSheet")} />
            </View>
            <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12 }}>
                {guilds.length === 0 ? (
                    <Text variant="text-md/medium">No servers available.</Text>
                ) : (
                    guilds.map((guild: any) => (
                        <AddToServerRow key={guild.id} guild={guild} emoji={emoji} />
                    ))
                )}
            </ScrollView>
        </ActionSheet>
    );
}

export function showAddToServerActionSheet(emoji: { id: string; name: string; animated?: boolean; src?: string; alt?: string }) {
    showSheet("AddToServerActionSheet", AddToServerContent, { emoji });
}
