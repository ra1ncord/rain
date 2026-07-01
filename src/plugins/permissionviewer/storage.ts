import { createPluginStore } from "@api/storage";

interface PermissionViewerSettings {
    savedGuildId: string | null;
    savedRoleId: string | null;
}

export const {
    useStore: usePermissionViewerSettings,
    settings: permissionViewerSettings,
} = createPluginStore<PermissionViewerSettings>("permissionviewer", {
    savedGuildId: null,
    savedRoleId: null,
});
