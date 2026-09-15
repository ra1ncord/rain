import { rawColors } from "@api/ui/components/color";
import { hideSheet, showSheet } from "@api/ui/sheets";
import { findByPropsLazy } from "@metro";
import { constants } from "@metro/common";
import { ActionSheet, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { GuildRoleStore } from "@metro/common/stores";
import React from "react";
import { ScrollView, View } from "react-native";

import { hasBits, PERMISSIONS, roleColorHex } from "../lib/permissions";
import PermissionSections from "./PermissionSections";
import SheetHeader from "./SheetHeader";

const shieldIcons = findByPropsLazy("ShieldUserIcon");

export default function RolesPage({ guildId }: { guildId: string }) {
    const roles: any[] = GuildRoleStore?.getSortedRoles?.(guildId) ?? [];

    return (
        <ActionSheet>
            <SheetHeader
                title="Roles"
                left={<View style={{ width: 40 }} />}
                onClose={() => hideSheet("permissionviewer-roles")}
            />
            {React.createElement(TableRowGroup as any, null,
                ...roles.map((role: any) => {
                    const color = roleColorHex(role) ?? constants?.DEFAULT_ROLE_COLOR_HEX;
                    return React.createElement(TableRow, {
                        key: role.id,
                        icon: React.createElement(shieldIcons.ShieldUserIcon, { color, size: "sm" }),
                        label: React.createElement(Text, { variant: "text-md/semibold" }, role.name),
                        trailing: () => React.createElement(TableRow.Arrow, null),
                        onPress: () => {
                            hideSheet("permissionviewer-roles");
                            showSheet("permissionviewer-role-" + role.id, RolePermissionsPage, { guildId, role });
                        },
                    });
                }),
                ...(roles.length === 0 ? [React.createElement(Text, { key: "empty", variant: "text-md/medium", style: { padding: 16, textAlign: "center" } }, "No roles found")] : [])
            )}
        </ActionSheet>
    );
}

function RolePermissionsPage({ guildId, role }: { guildId: string; role: any }) {
    const titleColor = roleColorHex(role);

    return (
        <ActionSheet>
            <SheetHeader
                title={role.name}
                titleColor={titleColor ?? undefined}
                left={
                    <Text
                        variant="text-md/semibold"
                        style={{ color: rawColors.BRAND_500 }}
                        onPress={() => {
                            hideSheet("permissionviewer-role-" + role.id);
                            showSheet("permissionviewer-roles", RolesPage, { guildId });
                        }}
                    >Back</Text>
                }
                onClose={() => hideSheet("permissionviewer-role-" + role.id)}
            />
            <ScrollView>
                <PermissionSections
                    hasPerm={(flagName: string) => {
                        const flag = PERMISSIONS[flagName];
                        return hasBits(role.permissions, flag);
                    }}
                />
            </ScrollView>
        </ActionSheet>
    );
}
