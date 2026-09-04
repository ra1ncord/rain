import { rawColors } from "@api/ui/components/color";
import { findByProps } from "@metro";
import { constants } from "@metro/common";
import { GuildMemberStore } from "@metro/common/stores";
import chroma from "chroma-js";

import { useStaffTagsSettings } from "../storage";

const { computePermissions } = findByProps("computePermissions", "canEveryoneRole") ?? {};

const messageCache = new Map<string, string>();

const getMessage = (key: string) => {
    if (messageCache.has(key)) return messageCache.get(key);

    const { intl, t } = findByProps("intl", "t") ?? {};
    const hash = findByProps("runtimeHashMessageKey", "MessageLoader")?.runtimeHashMessageKey?.(key);
    const value = t?.[hash];
    const resolved = value ? intl?.string?.(value) : undefined;
    if (resolved) messageCache.set(key, resolved);
    return resolved;
};

export const getBuiltInTags = () => [
    getMessage("AI_TAG"),
    getMessage("BOT_TAG_BOT"),
    getMessage("BOT_TAG_SERVER"),
    getMessage("SYSTEM_DM_TAG_SYSTEM"),
    getMessage("GUILD_AUTOMOD_USER_BADGE_TEXT"),
    getMessage("REMIXING_TAG")
].filter(Boolean);

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
        text: "WEBHOOK",
        condition: (guild, channel, user) => user?.isNonUserBot?.() ?? false
    },
    {
        text: "OWNER",
        condition: (guild, channel, user) => guild?.ownerId === user?.id
    },
    {
        text: "ADMIN",
        permissions: ["ADMINISTRATOR"]
    },
    {
        text: "STAFF",
        permissions: ["MANAGE_GUILD", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_WEBHOOKS"]
    },
    {
        text: "MOD",
        permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS"]
    },
    {
        text: "VC Mod",
        permissions: ["MOVE_MEMBERS", "MUTE_MEMBERS", "DEAFEN_MEMBERS"]
    },
    {
        text: "Chat Mod",
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
