import { after } from "@api/patcher";
import { showSheet } from "@api/ui/sheets";
import { findInReactTree } from "@lib/utils";
import { findByName } from "@metro";
import { byName } from "@metro/filters";
import { waitFor } from "@metro/internals/modules";

import UserPermissionPage from "../components/UserPermissionPage";

const NAMES = ["UserProfileOverflowMenu", "BotUserProfileOverflowMenu"];
let unpatches: (() => void)[] = [];

function getMainItems(ret: any): any[] | null {
    const node = findInReactTree(ret, (n: any) => Array.isArray(n?.props?.items) && Array.isArray(n.props.items[0]));
    return node?.props?.items[0] ?? null;
}

function patchFn(args: any[], ret: any) {
    const props = args[0] ?? {};
    const guildId = props.guildId ?? props.displayProfile?.guildId ?? props.channel?.guild_id;
    const userId = props.user?.id;
    if (!guildId || !userId) return;
    const items = getMainItems(ret);
    if (!items || items.some((i: any) => i?.label === "Permissions")) return;
    items.push({
        label: "Permissions",
        action: () => showSheet("permviewer-user-" + userId, UserPermissionPage, { guildId, userId }),
    });
}

export default () => {
    unpatches = [];

    for (const name of NAMES) {
        const mod = findByName(name, false);
        if (mod) {
            unpatches.push(after("default", mod, patchFn));
        } else {
            const cancel = waitFor(byName(name) as any, (exports: any) => {
                unpatches.push(after("default", exports, patchFn));
            });
            unpatches.push(cancel);
        }
    }

    return () => { for (const fn of unpatches) fn(); unpatches = []; };
};
