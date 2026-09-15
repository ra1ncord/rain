import { semanticColors } from "@api/ui/components/color";
import { hideSheet } from "@api/ui/sheets";
import { ActionSheet, Text } from "@metro/common/components";
import { GuildMemberStore, GuildRoleStore, GuildStore, UserStore } from "@metro/common/stores";
import React from "react";
import { Image, ScrollView, View } from "react-native";

import { hasBits, parseBits, PERMISSIONS, roleColorHex } from "../lib/permissions";
import PermissionSections from "./PermissionSections";
import SheetHeader from "./SheetHeader";

function getCombinedPerms(guildId: string, roleIds: string[]): bigint {
    let combined = 0n;
    const everyone = GuildRoleStore?.getRole?.(guildId, guildId);
    if (everyone?.permissions) combined |= parseBits(everyone.permissions);
    for (const id of roleIds) {
        const role = GuildRoleStore?.getRole?.(guildId, id);
        if (role?.permissions) combined |= parseBits(role.permissions);
    }
    return combined;
}

export default function UserPermissionPage({ guildId, userId }: { guildId: string; userId: string }) {
    const member = GuildMemberStore?.getMember?.(guildId, userId);
    const user = UserStore?.getUser?.(userId);
    const guild = GuildStore?.getGuild?.(guildId);
    const isOwner = guild?.ownerId === userId;
    const roleIds = member?.roles ?? [];
    const roles = roleIds.map((id: string) => GuildRoleStore?.getRole?.(guildId, id)).filter(Boolean);
    const perms = getCombinedPerms(guildId, roleIds);
    const avatarUrl = user?.getAvatarURL?.(true, 64) ?? (user ? `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png` : null);
    const name = member?.nick ?? user?.globalName ?? user?.username ?? userId.slice(0, 8);

    function hasPerm(flagName: string): boolean {
        if (isOwner) return true;
        const flag = PERMISSIONS[flagName];
        return hasBits(perms, flag);
    }

    return (
        <ActionSheet>
            <SheetHeader
                title={undefined}
                left={
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        {avatarUrl && <Image source={{ uri: avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />}
                        <Text variant="heading-md/semibold">{name}</Text>
                    </View>
                }
                onClose={() => hideSheet("permviewer-user-" + userId)}
            />
            {roles.length > 0 && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text variant="text-sm/bold" color="text-muted" style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Roles</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {roles.map((role: any) => {
                            const color = roleColorHex(role);
                            return (
                                <View key={role.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: semanticColors.BACKGROUND_MODIFIER_ACCENT, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, marginBottom: 4 }}>
                                    {color && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} />}
                                    <Text variant="text-sm/medium" style={color ? { color } : {}}>{role.name}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
            <ScrollView style={{ flex: 1 }}>
                <PermissionSections hasPerm={hasPerm} />
            </ScrollView>
        </ActionSheet>
    );
}

