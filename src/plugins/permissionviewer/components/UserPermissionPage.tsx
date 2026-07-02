import React from "react";
import { Image, ScrollView, View } from "react-native";

import { hideSheet } from "@api/ui/sheets";
import { findByProps, findByStoreName } from "@metro";
import { constants } from "@metro/common";
import { ActionSheet, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { rawColors, semanticColors } from "@api/ui/components/color";
import { PERMISSION_CATEGORIES, formatPermName } from "../lib/permissions";

const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton") ?? {};
const TableCheckboxRow = findByProps("TableCheckboxRow")?.TableCheckboxRow ?? null;
const GuildRoleStore = findByStoreName("GuildRoleStore");
const GuildMemberStore = findByStoreName("GuildMemberStore");
const UserStore = findByStoreName("UserStore");

function parsePerms(v: any): bigint {
    if (v == null) return 0n;
    try { return typeof v === "bigint" ? v : BigInt(v); } catch { return 0n; }
}

function getCombinedPerms(guildId: string, roleIds: string[]): bigint {
    let combined = 0n;
    const everyone = GuildRoleStore?.getRole?.(guildId, guildId);
    if (everyone?.permissions) combined |= parsePerms(everyone.permissions);
    for (const id of roleIds) {
        const role = GuildRoleStore?.getRole?.(guildId, id);
        if (role?.permissions) combined |= parsePerms(role.permissions);
    }
    return combined;
}

export default function UserPermissionPage({ guildId, userId }: { guildId: string; userId: string }) {
    const member = GuildMemberStore?.getMember?.(guildId, userId);
    const user = UserStore?.getUser?.(userId);
    const roleIds = member?.roles ?? [];
    const roles = roleIds.map((id: string) => GuildRoleStore?.getRole?.(guildId, id)).filter(Boolean);
    const perms = getCombinedPerms(guildId, roleIds);
    const avatarUrl = user?.getAvatarURL?.(true, 64) ?? (user ? `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png` : null);
    const name = member?.nick ?? user?.globalName ?? user?.username ?? userId.slice(0, 8);
    const Perms = constants.Permissions ?? {};

    function hasPerm(flagName: string): boolean {
        const flag = Perms[flagName];
        if (flag == null) return false;
        const f = typeof flag === "bigint" ? flag : BigInt(flag);
        return (perms & f) === f;
    }

    return (
        <ActionSheet>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    {avatarUrl && <Image source={{ uri: avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />}
                    <Text variant="heading-md/semibold">{name}</Text>
                </View>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, { onPress: () => hideSheet("permviewer-user-" + userId) })
                    : <Text variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => hideSheet("permviewer-user-" + userId)}>Close</Text>}
            </View>
            {roles.length > 0 && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text variant="text-sm/bold" color="text-muted" style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Roles</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {roles.map((role: any) => {
                            const roleColor = role.color > 0 ? `#${role.color.toString(16).padStart(6, "0")}` : null;
                            return (
                                <View key={role.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: semanticColors.BACKGROUND_MODIFIER_ACCENT, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, marginBottom: 4 }}>
                                    {roleColor && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: roleColor, marginRight: 4 }} />}
                                    <Text variant="text-sm/medium" style={roleColor ? { color: roleColor } : {}}>{role.name}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
            <ScrollView style={{ flex: 1 }}>
                {PERMISSION_CATEGORIES.map((section) => {
                    const sectionPerms = section.permissions.filter((p) => Perms[p] != null);
                    if (sectionPerms.length === 0) return null;
                    return (
                        <TableRowGroup key={section.name}>
                            {sectionPerms.map((permName) => {
                                const checked = hasPerm(permName);
                                return TableCheckboxRow
                                    ? React.createElement(TableCheckboxRow, { key: permName, label: formatPermName(permName), checked, disabled: true })
                                    : React.createElement(TableRow, { key: permName, label: formatPermName(permName), trailing: () => React.createElement(Text, { variant: "text-sm/medium", style: { color: checked ? rawColors.GREEN_360 : undefined } }, checked ? "Yes" : "No") });
                            })}
                        </TableRowGroup>
                    );
                })}
                <View style={{ height: 80 }} />
            </ScrollView>
        </ActionSheet>
    );
}
