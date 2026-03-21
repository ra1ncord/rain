import { createPluginStore } from "@api/storage";

interface StaffTagsSettings {
    useRoleColor: boolean;
}

export const {
    useStore: useStaffTagsSettings,
    settings: staffTagsSettings,
} = createPluginStore<StaffTagsSettings>("stafftags", {
    useRoleColor: false,
});
