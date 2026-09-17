import { rawColors } from "@api/ui/components/color";
import { TableCheckboxRow as TCheckboxRow, TableRow, TableRowGroup, Text } from "@metro/common/components";
import React from "react";
import { View } from "react-native";

import { formatPermName, PERMISSION_CATEGORIES, PERMISSIONS } from "../lib/permissions";

const TableCheckboxRow: any = TCheckboxRow ?? null;

export default function PermissionSections({ hasPerm }: { hasPerm: (flagName: string) => boolean }) {
    return (
        <>
            {PERMISSION_CATEGORIES.map(section => {
                const sectionPerms = section.permissions.filter(p => PERMISSIONS[p] != null);
                if (sectionPerms.length === 0) return null;
                return (
                    <View key={section.name} style={{ marginBottom: 8 }}>
                        {React.createElement(TableRowGroup as any, null,
                            ...sectionPerms.map(permName =>
                                TableCheckboxRow
                                    ? React.createElement(TableCheckboxRow, { key: permName, label: formatPermName(permName), checked: hasPerm(permName), disabled: true })
                                    : React.createElement(TableRow as any, { key: permName, label: formatPermName(permName), trailing: () => React.createElement(Text, { variant: "text-sm/medium", style: { color: hasPerm(permName) ? rawColors.GREEN_360 : undefined } }, hasPerm(permName) ? "Yes" : "No") })
                            )
                        )}
                    </View>
                );
            })}
            <View style={{ height: 80 }} />
        </>
    );
}
