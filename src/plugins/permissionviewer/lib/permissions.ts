import { findByName, findByProps } from "@metro";
import { constants } from "@metro/common";

const getPermName = findByProps("getPermissionName")?.getPermissionName ?? findByName("getPermissionName", false);

export const PERMISSION_CATEGORIES: { name: string; permissions: string[] }[] = [
    {
        name: "General",
        permissions: ["ADMINISTRATOR", "VIEW_AUDIT_LOG", "MANAGE_GUILD"],
    },
    {
        name: "Text",
        permissions: [
            "SEND_MESSAGES", "MANAGE_MESSAGES", "MENTION_EVERYONE", "ATTACH_FILES",
            "ADD_REACTIONS", "SEND_TTS_MESSAGES", "USE_EXTERNAL_EMOJI",
            "USE_EXTERNAL_STICKERS", "USE_EXTERNAL_SOUNDS", "SEND_VOICE_MESSAGES",
            "EMBED_LINKS", "READ_MESSAGE_HISTORY", "USE_APPLICATION_COMMANDS",
        ],
    },
    {
        name: "Voice",
        permissions: [
            "CONNECT", "SPEAK", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS",
            "USE_VAD", "PRIORITY_SPEAKER", "STREAM", "USE_SOUNDBOARD",
        ],
    },
    {
        name: "Channel",
        permissions: [
            "VIEW_CHANNEL", "MANAGE_CHANNELS", "MANAGE_WEBHOOKS",
            "CREATE_INSTANT_INVITE", "CREATE_EVENTS",
        ],
    },
    {
        name: "Members",
        permissions: ["KICK_MEMBERS", "BAN_MEMBERS", "MODERATE_MEMBERS"],
    },
    {
        name: "Roles",
        permissions: ["MANAGE_ROLES", "CHANGE_NICKNAME", "MANAGE_NICKNAMES"],
    },
    {
        name: "Expressions",
        permissions: ["CREATE_GUILD_EXPRESSIONS", "MANAGE_GUILD_EXPRESSIONS"],
    },
    {
        name: "Misc",
        permissions: [
            "MANAGE_THREADS", "CREATE_PUBLIC_THREADS", "CREATE_PRIVATE_THREADS",
            "SEND_MESSAGES_IN_THREADS", "MANAGE_EVENTS",
            "VIEW_CREATOR_MONETIZATION_ANALYTICS", "USE_CREATED_WEBHOOKS",
        ],
    },
];

const CHANNEL_CATEGORIES = new Set(["Text", "Voice", "Channel", "Roles", "Expressions", "Misc"]);
export const OVERWRITE_PERMISSIONS = PERMISSION_CATEGORIES
    .filter((c) => CHANNEL_CATEGORIES.has(c.name))
    .flatMap((c) => c.permissions);

export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatPermName(name: string): string {
    const bit = constants?.Permissions?.[name];
    if (bit != null && getPermName) {
        try {
            const localized = getPermName(bit);
            if (localized) return localized;
        } catch {}
    }
    return name.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}
