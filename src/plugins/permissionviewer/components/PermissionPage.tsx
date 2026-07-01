import React from "react";
import { ScrollView, View } from "react-native";
import { hideSheet, showSheet } from "@api/ui/sheets";
import { findByProps, findByStoreName } from "@metro";
import { constants } from "@metro/common";
import { ActionSheet, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { rawColors } from "@api/ui/components/color";
import { PERMISSION_CATEGORIES, formatPermName } from "../lib/permissions";

const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton") ?? {};
const TableCheckboxRow = findByProps("TableCheckboxRow")?.TableCheckboxRow ?? null;
const GuildRoleStore = findByStoreName("GuildRoleStore");

function tryHasPerm(perms: any, flag: any): boolean {
    if (perms == null || flag == null) return false;
    try {
        const p = typeof perms === "bigint" ? perms : BigInt(perms);
        const f = typeof flag === "bigint" ? flag : BigInt(flag);
        return (p & f) === f;
    } catch {
        return false;
    }
}

export default function RolesPage({ guildId }: { guildId: string }) {
    const roles = GuildRoleStore?.getSortedRoles?.(guildId) ?? [];
    const roleList = Array.isArray(roles) ? roles : Object.values(roles);

    return (
        <ActionSheet>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <View style={{ width: 40 }} />
                <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>Roles</Text>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, { onPress: () => hideSheet("permissionviewer-roles") })
                    : React.createElement(Text, { variant: "text-md/semibold", style: { color: rawColors.BRAND_500 }, onPress: () => hideSheet("permissionviewer-roles") }, "Close")}
            </View>
            <TableRowGroup>
                {roleList.map((role: any) => {
                    const color = role.color > 0 ? `#${role.color.toString(16).padStart(6, "0")}` : null;
                    return React.createElement(TableRow, {
                        key: role.id,
                        label: color
                            ? React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
                                React.createElement(View, { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 } }),
                                React.createElement(Text, { variant: "text-md/semibold" }, role.name),
                            )
                            : role.name,
                        trailing: () => React.createElement(TableRow.Arrow, null),
                        onPress: () => {
                            hideSheet("permissionviewer-roles");
                            setTimeout(() => showSheet("permissionviewer-role-" + role.id, RolePermsPage, { guildId, role }), 100);
                        },
                    });
                })}
                {roleList.length === 0 && (
                    <View style={{ padding: 16, alignItems: "center" }}>
                        <Text variant="text-md/medium">No roles found</Text>
                    </View>
                )}
            </TableRowGroup>
        </ActionSheet>
    );
}

function RolePermsPage({ guildId, role }: { guildId: string; role: any }) {
    const Perms = constants?.Permissions ?? {};
    const titleColor = role?.color > 0 ? `#${role.color.toString(16).padStart(6, "0")}` : null;

    return (
        <ActionSheet>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <Text variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => {
                    hideSheet("permissionviewer-role-" + role.id);
                    setTimeout(() => showSheet("permissionviewer-roles", RolesPage, { guildId }), 100);
                }}>Back</Text>
                <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center", ...(titleColor ? { color: titleColor } : {}) }}>
                    {role.name}
                </Text>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, { onPress: () => hideSheet("permissionviewer-role-" + role.id) })
                    : React.createElement(Text, { variant: "text-md/semibold", style: { color: rawColors.BRAND_500 }, onPress: () => hideSheet("permissionviewer-role-" + role.id) }, "Close")}
            </View>
            <ScrollView>
                {PERMISSION_CATEGORIES.map((section) => {
                    const sectionPerms = section.permissions.filter((p) => Perms[p] != null);
                    if (sectionPerms.length === 0) return null;
                    return (
                        <TableRowGroup key={section.name}>
                            {sectionPerms.map((permName) => {
                                const flag = Perms[permName];
                                const hasPerm = tryHasPerm(role.permissions, flag);
                                return TableCheckboxRow
                                    ? React.createElement(TableCheckboxRow, { key: permName, label: formatPermName(permName), checked: hasPerm, disabled: true })
                                    : React.createElement(TableRow, { key: permName, label: formatPermName(permName), trailing: () => React.createElement(Text, { variant: "text-sm/medium", style: { color: hasPerm ? rawColors.GREEN_360 : undefined } }, hasPerm ? "Yes" : "No") });
                            })}
                        </TableRowGroup>
                    );
                })}
                <View style={{ height: 80 }} />
            </ScrollView>
        </ActionSheet>
    );
}
