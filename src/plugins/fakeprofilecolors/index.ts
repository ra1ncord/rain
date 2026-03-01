import { after } from "@api/patcher";
import { UserStore } from "@metro/common/stores";
import { findByName, findByStoreName } from "@metro/wrappers";
import { definePlugin } from "@plugins";

import { fetchRegistryColors } from "./api";
import { useProfileColorStore } from "./storage";

// In-memory cache of already-resolved registry colors for synchronous access in patches
const resolvedColors = new Map<string, { primary: number; accent: number } | null>();
// Track in-flight fetches to avoid duplicates
const pendingFetches = new Set<string>();

/**
 * Kick off an async fetch for a user's registry colors.
 * When it resolves we force UserProfileStore to re-emit so the patch re-runs.
 */
function ensureRegistryColors(userId: string) {
    if (resolvedColors.has(userId) || pendingFetches.has(userId)) return;
    const state = useProfileColorStore.getState();
    if (!state.showOtherColors || !state.registryUrl) return;

    pendingFetches.add(userId);
    fetchRegistryColors(userId)
        .then(colors => {
            resolvedColors.set(userId, colors);
            // Force a store re-emit so patches re-run with the resolved data
            try {
                const UserProfileStore = findByStoreName("UserProfileStore");
                UserProfileStore?.emitChange?.();
            } catch {}
        })
        .catch(() => {
            resolvedColors.set(userId, null);
        })
        .finally(() => {
            pendingFetches.delete(userId);
        });
}
function patchUseProfileTheme() {
    const funcParent = findByName("useProfileTheme", false);
    if (!funcParent) return;
    after("default", funcParent, ([options]: any[], profileTheme: any) => {
        const currentUser = UserStore?.getCurrentUser?.();
        if (!currentUser) {
            return profileTheme;
        }
        const userId = options?.userId || profileTheme?.userId || profileTheme?.id;
        if (userId !== currentUser.id) {
            return profileTheme;
        }
        const state = useProfileColorStore.getState();
        if (state.enabled && (state.primary !== null || state.accent !== null)) {
            if (state.primary !== null) {
                profileTheme.primaryColor = state.primary;
                profileTheme.secondaryColor = state.accent ?? state.primary;
                profileTheme.theme = profileTheme.theme;
            } else if (state.accent !== null) {
                profileTheme.primaryColor = state.accent;
                profileTheme.secondaryColor = state.accent;
                profileTheme.theme = profileTheme.theme;
            }
        }
        return profileTheme;
    });
}

function patchGetUserProfile() {
    const UserProfileStore = findByStoreName("UserProfileStore");
    if (!UserProfileStore) return;
    after("getUserProfile", UserProfileStore, (_args: unknown[], profile: any) => {
        if (!profile) {
            return profile;
        }
        const currentUser = UserStore?.getCurrentUser?.();
        if (!currentUser) {
            return profile;
        }
        const state = useProfileColorStore.getState();
        if (!state._hasHydrated) {
            return profile;
        }

        let userId = profile.id;
        if (!userId) {
            userId = profile.userId || profile.user_id || profile?.user?.id;
        }
        if (!userId) {
            return profile;
        }

        function safeHex(num: number | null) {
            if (typeof num !== "number" || isNaN(num)) return null;
            const hex = num.toString(16).padStart(6, "0");
            if (!/^([0-9a-fA-F]{6})$/.test(hex)) return null;
            return parseInt(hex, 16);
        }
        if (userId === currentUser.id) {
            const primary = safeHex(state.primary);
            const accent = safeHex(state.accent);
            if (state.enabled && (primary !== null || accent !== null)) {
                profile.themeColors = [primary ?? accent, accent ?? primary ?? accent];
                profile.premiumType = 2;
            } else {
            }
        } else {
            // Other users: check registry colors first, then banner fallback
            if (state.showOtherColors) {
                const regColors = resolvedColors.get(userId);
                if (regColors) {
                    profile.themeColors = [regColors.primary, regColors.accent];
                    profile.premiumType = 2;
                    return profile;
                }
                // Kick off async fetch if not yet resolved
                ensureRegistryColors(userId);
            }

            if (state.bannerFallback && (!profile.premiumType || profile.premiumType === 0) && profile.bannerColor) {
                let color = profile.bannerColor;
                if (typeof color === "number") color = `#${color.toString(16).padStart(6, "0")}`;
                if (!/^#?[0-9a-fA-F]{6}$/.test(color)) {
                    return profile;
                }
                profile.themeColors = [color, color];
            } else {
            }
        }
        return profile;
    });
}

function patchUserProfileEditForm() {
    const UserProfileEditForm = findByName("UserProfileEditForm", false);
    if (!UserProfileEditForm) return;
    after("default", UserProfileEditForm, (_args: unknown[], tree: any) => {
        function removeNitroCards(node: any): any {
            if (!node) return null;
            if (node.type && node.type.name === "UserProfilePremiumUpsellCard") return null;
            if (node.props?.children) {
                let children = node.props.children;
                if (!Array.isArray(children)) children = [children];
                const filteredChildren = children.map(removeNitroCards).filter((child: any) => child !== null);
                node.props.children = filteredChildren.length === 1 ? filteredChildren[0] : filteredChildren;
            }
            return node;
        }
        return removeNitroCards(tree) || tree;
    });
}

import { Developers } from "@rain/Developers";

import Settings from "./settings";

export default definePlugin({
    name: "FakeProfileColors",
    description: "Set fake profile colors for yourself",
    id: "fakeprofilecolors",
    version: "1.0.0",
    author: [Developers.LampDelivery],
    start() {
        patchUseProfileTheme();
        patchGetUserProfile();
        patchUserProfileEditForm();
    },
    stop() {
    },
    settings: Settings,
});
