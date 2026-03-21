import { rawColors } from "@api/ui/components/color";
import { findByProps, findByStoreName } from "@metro";
import { constants, i18n } from "@metro/common";
import { Strings } from "@rain/i18n";
import chroma from "chroma-js";

import { useStaffTagsSettings } from "../storage";

const { computePermissions } = findByProps("computePermissions", "canEveryoneRole") ?? {};
const GuildMemberStore = findByStoreName("GuildMemberStore");

const getBuiltInTags = () => [
    i18n?.Messages?.AI_TAG,
    i18n?.Messages?.BOT_TAG_BOT,
    i18n?.Messages?.BOT_TAG_SERVER,
    i18n?.Messages?.SYSTEM_DM_TAG_SYSTEM,
    i18n?.Messages?.GUILD_AUTOMOD_USER_BADGE_TEXT,
    i18n?.Messages?.REMIXING_TAG
].filter(Boolean);

export const BUILT_IN_TAGS = getBuiltInTags();

interface Tag {
    text: string
    textColor?: any
    backgroundColor?: any
    verified?: boolean | ((guild: any, channel: any, user: any) => boolean)
    condition?: (guild: any, channel: any, user: any) => boolean
    permissions?: string[]
}

const tags: Tag[] = [
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.WEBHOOK,
        condition: (guild, channel, user) => user?.isNonUserBot?.() ?? false
    },
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.OWNER,
        condition: (guild, channel, user) => guild?.ownerId === user?.id
    },
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.ADMIN,
        permissions: ["ADMINISTRATOR"]
    },
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.STAFF,
        permissions: ["MANAGE_GUILD", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_WEBHOOKS"]
    },
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.MOD,
        permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS"]
    },
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.VC_MOD,
        permissions: ["MOVE_MEMBERS", "MUTE_MEMBERS", "DEAFEN_MEMBERS"]
    },
    {
        text: Strings.PLUGINS.CUSTOM.STAFFTAGS.CHAT_MOD,
        permissions: ["MODERATE_MEMBERS"]
    }
];

export default function getTag(guild: any, channel: any, user: any) {
    if (!guild || !user) return undefined;

    let permissions: string[] = [];
    if (computePermissions) {
        const permissionsInt = computePermissions({
            user: user,
            context: guild,
            overwrites: channel?.permissionOverwrites
        });
        const Permissions = constants?.Permissions;
        if (Permissions) {
            permissions = Object.entries(Permissions)
                .filter(([, permissionInt]) => (permissionsInt as bigint) & (permissionInt as bigint))
                .map(([permission]) => permission);
        }
    }

    const useRoleColor = useStaffTagsSettings.getState()?.useRoleColor ?? false;

    for (const tag of tags) {
        if (tag.condition?.(guild, channel, user) ||
            (!user.bot && tag.permissions?.some(perm => permissions?.includes(perm)))) {

            const roleColor = useRoleColor && GuildMemberStore ? GuildMemberStore.getMember(guild?.id, user.id)?.colorString : undefined;
            const backgroundColor = roleColor ? roleColor : tag.backgroundColor ?? rawColors?.BRAND_500 ?? "#5865F2";
            const textColor = (roleColor || !tag.textColor) ? (chroma(backgroundColor).get("lab.l") < 70 ? rawColors?.WHITE_500 ?? "#ffffff" : rawColors?.BLACK_500 ?? "#000000") : tag.textColor;

            return {
                ...tag,
                textColor,
                backgroundColor,
                verified: typeof tag.verified === "function" ? tag.verified(guild, channel, user) : tag.verified ?? false,
                condition: undefined,
                permissions: undefined
            };
        }
    }
}
