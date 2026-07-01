import { after } from "@api/patcher";
import { showSheet } from "@api/ui/sheets";
import { findByName } from "@metro";
import { React } from "@metro/common";
import { TableRow, TableRowGroup } from "@metro/common/components";

import RolesPage from "../components/PermissionPage";

const GuildActionSheetProgress = findByName("GuildActionSheetProgress", false);
const SYM_PATCHED = Symbol.for("PermissionViewerPatched");

function PermissionButton({ guild }: { guild: any }) {
    return React.createElement(TableRowGroup, null,
        React.createElement(TableRow, {
            label: "Roles",
            trailing: TableRow.Arrow,
            onPress: () => {
                showSheet("permissionviewer-roles", RolesPage, { guildId: guild.id });
            },
        })
    );
}

export default () => {
    if (!GuildActionSheetProgress) return () => {};

    return after("default", GuildActionSheetProgress, (args, ret) => {
        const guild = args[0]?.guild;
        if (!guild || !ret || ret?.[SYM_PATCHED]) return;
        ret[SYM_PATCHED] = true;

        return React.createElement(React.Fragment, null,
            ret,
            React.createElement(PermissionButton, { guild }),
        );
    });
};
