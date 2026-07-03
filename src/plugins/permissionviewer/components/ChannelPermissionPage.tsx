import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { hideSheet } from "@api/ui/sheets";
import { findByNameLazy, findByProps, findByStoreName } from "@metro";
import { constants } from "@metro/common";
import { ActionSheet, Text } from "@metro/common/components";
import { rawColors, semanticColors } from "@api/ui/components/color";
import { formatPermName, hexToRgba, OVERWRITE_PERMISSIONS } from "../lib/permissions";

const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton") ?? {};
const showUserProfile = findByNameLazy("showUserProfileActionSheet");
const ChannelStore = findByStoreName("ChannelStore");
const GuildRoleStore = findByStoreName("GuildRoleStore");
const GuildMemberStore = findByStoreName("GuildMemberStore");
const UserStore = findByStoreName("UserStore");

function getPermsFromOverwrite(ow: any, Perms: Record<string, any>) {
    const allow = typeof ow.allow === "bigint" ? ow.allow : BigInt(ow.allow ?? "0");
    const deny = typeof ow.deny === "bigint" ? ow.deny : BigInt(ow.deny ?? "0");
    return {
        allowed: OVERWRITE_PERMISSIONS.filter((p) => (allow & (Perms[p] ?? 0n)) !== 0n),
        denied: OVERWRITE_PERMISSIONS.filter((p) => (deny & (Perms[p] ?? 0n)) !== 0n),
    };
}

export default function ChannelPermsView({ channelId }: { channelId: string }) {
    const channel = ChannelStore?.getChannel?.(channelId);
    if (!channel) return null;
    const guildId = channel.guild_id;
    if (!guildId) {
        return (
            <ActionSheet>
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                    <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>{channel.name}</Text>
                    {ActionSheetCloseButton ? <ActionSheetCloseButton onPress={() => hideSheet("permissionviewer-channel-" + channelId)} /> : (
                        <Text variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => hideSheet("permissionviewer-channel-" + channelId)}>Close</Text>
                    )}
                </View>
                <View style={{ padding: 16, alignItems: "center" }}>
                    <Text variant="text-md/medium">Channel is not in a server</Text>
                </View>
            </ActionSheet>
        );
    }

    const roles = GuildRoleStore?.getSortedRoles?.(guildId) ?? [];
    const roleList = Array.from(roles);
    const roleMap: Record<string, any> = {};
    for (const r of roleList) roleMap[r.id] = r;

    const overwrites: any[] = Array.isArray(channel.permissionOverwrites)
        ? channel.permissionOverwrites
        : channel.permissionOverwrites ? Object.values(channel.permissionOverwrites) : [];

    const Perms = constants?.Permissions ?? {};

    const roleOverwrites = overwrites.filter((ow: any) => ow.type === 0);
    const memberOverwrites = overwrites.filter((ow: any) => ow.type === 1);

    return (
        <ActionSheet>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>#{channel.name}</Text>
                {ActionSheetCloseButton ? <ActionSheetCloseButton onPress={() => hideSheet("permissionviewer-channel-" + channelId)} /> : (
                    <Text variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => hideSheet("permissionviewer-channel-" + channelId)}>Close</Text>
                )}
            </View>
            <ScrollView style={{ flex: 1 }}>
                {roleOverwrites.length === 0 && memberOverwrites.length === 0 && (
                    <View style={{ padding: 16, alignItems: "center" }}>
                        <Text variant="text-md/medium">No custom permissions</Text>
                        <Text variant="text-sm/medium" color="text-muted" style={{ marginTop: 4 }}>
                            This channel uses the server's default permissions
                        </Text>
                    </View>
                )}
                {roleOverwrites.length > 0 && (
                    <View>
                        <Text variant="text-sm/bold" color="text-muted" style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Roles ({roleOverwrites.length})
                        </Text>
                        {roleOverwrites.map((ow: any) => {
                            const role = roleMap[ow.id];
                            const name = role?.name ?? "Unknown role";
                            const color = role?.color > 0 ? `#${role.color.toString(16).padStart(6, "0")}` : null;
                            const { allowed, denied } = getPermsFromOverwrite(ow, Perms);
                            return (
                                <View key={ow.id} style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: semanticColors.BACKGROUND_MODIFIER_ACCENT }}>
                                    <Text variant="text-md/semibold" style={color ? { color } : {}}>{name}</Text>
                                    {allowed.length > 0 && (
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {allowed.map((p) => (
                                                <View key={p} style={{ backgroundColor: hexToRgba(rawColors.GREEN_360, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <Text variant="text-xs/medium" style={{ color: rawColors.GREEN_360 }}>{formatPermName(p)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {denied.length > 0 && (
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {denied.map((p) => (
                                                <View key={p} style={{ backgroundColor: hexToRgba(rawColors.RED_400, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <Text variant="text-xs/medium" style={{ color: rawColors.RED_400 }}>{formatPermName(p)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {allowed.length === 0 && denied.length === 0 && (
                                        <Text variant="text-sm/medium" color="text-muted" style={{ marginTop: 4 }}>No changes</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
                {memberOverwrites.length > 0 && (
                    <View>
                        <Text variant="text-sm/bold" color="text-muted" style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Members ({memberOverwrites.length})
                        </Text>
                        {memberOverwrites.map((ow: any) => {
                            const userId = ow.id;
                            const member = GuildMemberStore?.getMember?.(guildId, userId);
                            const user = member?.user ?? UserStore?.getUser?.(userId);
                            const name = member?.nick ?? user?.globalName ?? user?.username ?? `User ${userId.slice(0, 6)}`;
                            const avatarUrl = user?.getAvatarURL?.(true, 64) ?? `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(userId) >> 22n) % 6n)}.png`;
                            const { allowed, denied } = getPermsFromOverwrite(ow, Perms);
                            return (
                                <Pressable key={ow.id} onPress={() => showUserProfile?.({ userId: ow.id })} style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: semanticColors.BACKGROUND_MODIFIER_ACCENT, backgroundColor: pressed ? semanticColors.BACKGROUND_MODIFIER_HOVER : "transparent" })}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                                        {avatarUrl && <Image source={{ uri: avatarUrl }} style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8 }} />}
                                        <Text variant="text-md/semibold">{name}</Text>
                                    </View>
                                    {allowed.length > 0 && (
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {allowed.map((p) => (
                                                <View key={p} style={{ backgroundColor: hexToRgba(rawColors.GREEN_360, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <Text variant="text-xs/medium" style={{ color: rawColors.GREEN_360 }}>{formatPermName(p)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {denied.length > 0 && (
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {denied.map((p) => (
                                                <View key={p} style={{ backgroundColor: hexToRgba(rawColors.RED_400, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <Text variant="text-xs/medium" style={{ color: rawColors.RED_400 }}>{formatPermName(p)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {allowed.length === 0 && denied.length === 0 && (
                                        <Text variant="text-sm/medium" color="text-muted" style={{ marginTop: 4 }}>No changes</Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>
        </ActionSheet>
    );
}
