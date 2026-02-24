import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";

const ClydeUtils = findByProps("sendBotMessage", "sendMessage");
const inviteModule = findByProps(
    "getAllFriendInvites",
    "createFriendInvite",
    "revokeFriendInvites",
);
const getCurrentUser = findByProps("getCurrentUser")?.getCurrentUser;

function send(ctx: any, content: any) {
    const fixNonce = Date.now().toString();
    ClydeUtils.sendMessage(ctx.channel.id, { content }, void 0, {
        nonce: fixNonce,
    });
}

export const friendInviteCreateCommand = {
    name: "invite create",
    displayName: "invite create",
    description: "Generates a friend invite link.",
    displayDescription: "Generates a friend invite link.",
    type: 1,
    applicationId: "-1",
    inputType: 1,
    execute: async (_: any, ctx: any) => {
        try {
            if (!getCurrentUser?.().phone) {
                showToast(
                    "You need a phone number connected to your account!",
                    findAssetId("Small"),
                );
                return null;
            }

            // Main method: Create friend invite directly
            const createInvite = await inviteModule.createFriendInvite({
                code: null,
                recipient_phone_number_or_email: null,
                contact_visibility: 0,
                filter_visibilities: [],
                filtered_invite_suggestions_index: 0,
            });

            if (createInvite?.code) {
                const expires = Math.floor(
                    new Date(createInvite.expires_at).getTime() / 1000,
                );
                const message = `https://discord.gg/${createInvite.code} · Expires: <t:${expires}:R>`;
                send(ctx, message);
                showToast("Friend invite created!", findAssetId("Check"));
            } else {
                throw new Error("No invite code generated");
            }

            return null;
        } catch (e) {
            console.error("[FriendInvite] Create error:", e);
            showToast("Error creating friend invite", findAssetId("Small"));
            return null;
        }
    },
};

export const friendInviteViewCommand = {
    name: "view invites",
    displayName: "view invites",
    description: "View your current friend invite links that you've made.",
    displayDescription: "View your current friend invite links that you've made.",
    type: 1,
    applicationId: "-1",
    execute: async (_: any, ctx: any) => {
        try {
            const invites = await inviteModule.getAllFriendInvites();
            if (!invites?.length) {
                showToast("No active friend invites found", findAssetId("Info"));
                return null;
            }

            const friendInviteList = invites.map((i: any) => {
                const expires = Math.floor(new Date(i.expires_at).getTime() / 1000);
                return `_https://discord.gg/${i.code}_ · Expires: <t:${expires}:R> · Uses: \`${i.uses}/${i.max_uses}\``;
            });

            send(
                ctx,
                `**Your Active Friend Invites:**\n${friendInviteList.join("\n")}`,
            );

            return null;
        } catch (e) {
            console.error("[FriendInvite] View error:", e);
            showToast("Error viewing friend invites", findAssetId("Small"));
            return null;
        }
    },
};

export const friendInviteRevokeCommand = {
    name: "revoke invites",
    displayName: "revoke invites",
    description: "Revoke all your friend invite links.",
    displayDescription: "Revoke all your friend invite links.",
    type: 1,
    applicationId: "-1",
    inputType: 1,
    execute: async (_: any, ctx: any) => {
        try {
            const invitesBefore = await inviteModule.getAllFriendInvites();

            if (!invitesBefore?.length) {
                showToast(
                    "No active friend invites to revoke",
                    findAssetId("Info"),
                );
                return null;
            }

            await inviteModule.revokeFriendInvites();

            // Verify revocation worked
            const invitesAfter = await inviteModule.getAllFriendInvites();

            if (invitesAfter.length === 0) {
                showToast(
                    `Successfully revoked all ${invitesBefore.length} friend invite(s)!`,
                    findAssetId("Check"),
                );
            } else {
                showToast(
                    `⚠️ Partially revoked invites. ${invitesAfter.length} invite(s) remain active.`,
                    findAssetId("Warning"),
                );
            }

            return null;
        } catch (e) {
            console.error("[FriendInvite] Revoke error:", e);
            showToast("Error revoking friend invites", findAssetId("Small"));
            return null;
        }
    },
};
