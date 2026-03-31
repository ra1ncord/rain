import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { NavigationNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { API_BASE, apiFetch } from "./lib/api";
import { showAuthModal } from "./lib/showAuthModal";
import { useAuthorizationStore } from "./stores/AuthorizationStore";
import MyEffects from "./ui/pages/myeffects";
import Presets from "./ui/pages/presets";

export default function CustomEffectSettings() {
    const authStore = useAuthorizationStore();
    const navigation = NavigationNative.useNavigation();
    const [hasEffects, setHasEffects] = React.useState(false);
    const [selectedEffect, setSelectedEffect] = React.useState<string | null>(null);
    const [userId, setUserId] = React.useState<string | null>(null);

    const refreshUserData = React.useCallback(async () => {
        if (!authStore.token) {
            setSelectedEffect(null);
            setUserId(null);
            return;
        }

        try {
            const me = await apiFetch("/me", { method: "POST" });
            setUserId(me.userId);
            setSelectedEffect(me.data.selected);
        } catch (e) {
            console.error("Failed to fetch user info", e);
        }
    }, [authStore.token]);

    React.useEffect(() => {
        refreshUserData();

        const unsubscribe = navigation.addListener("focus", refreshUserData);
        return unsubscribe;
    }, [navigation, refreshUserData]);

    React.useEffect(() => {
        (async () => {
            try {
                const effects = await apiFetch("/my-effects", { method: "POST" });
                setHasEffects(effects.length > 0);
            } catch (e) {
                console.error("Failed to fetch effects", e);
            }
        })();
    }, []);

    const handleRemoveEffect = React.useCallback(async () => {
        if (!selectedEffect) return;

        try {
            await apiFetch("/set-effect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ effectId: null }),
            });

            setSelectedEffect(null);
            showToast("Effect removed", findAssetId("CheckIcon"));
        } catch (e) {
            console.error("Failed to remove effect", e);
            showToast("Failed to remove effect", findAssetId("CircleXIcon"));
        }
    }, [selectedEffect, userId]);

    const handleLogout = React.useCallback(async () => {
        try {
            const token = authStore.token;
            if (token) {
                await fetch(`${API_BASE}/logout`, {
                    method: "POST",
                    headers: { Authorization: token },
                });
            }
        } catch (e) {
            console.error("[CustomEffects] Logout failed", e);
        } finally {
            authStore.setToken(undefined);
            showToast("Logged out", findAssetId("CheckIcon"));
        }
    }, [authStore]);

    const handleNavigateToMyEffects = React.useCallback(() => {
        navigation.push("RAIN_CUSTOM_PAGE", {
            title: "Your Effects",
            render: MyEffects,
        });
    }, [navigation]);

    const handleNavigateToPresets = React.useCallback(() => {
        navigation.push("RAIN_CUSTOM_PAGE", {
            title: "Presets",
            render: Presets,
        });
    }, [navigation]);

    const handleOpenDiscord = React.useCallback(() => {
        const { Linking } = require("react-native");
        Linking.openURL("https://discord.gg/vnyY3VWjyr");
    }, []);

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                {authStore.isAuthorized() ? (
                    <>
                        <TableRowGroup title="Effects">
                            <TableRow
                                label="Remove Effect"
                                subLabel="Remove your currently selected effect"
                                icon={<TableRow.Icon source={findAssetId("TrashIcon")} />}
                                disabled={!selectedEffect}
                                onPress={handleRemoveEffect}
                            />
                            {hasEffects && (
                                <TableRow
                                    label="Your Effects"
                                    subLabel="Your approved effects"
                                    icon={<TableRow.Icon source={findAssetId("ic_reaction_smile")} />}
                                    trailing={TableRow.Arrow}
                                    arrow
                                    onPress={handleNavigateToMyEffects}
                                />
                            )}
                            <TableRow
                                label="Browse Presets"
                                subLabel="Browse through presets"
                                icon={<TableRow.Icon source={findAssetId("ic_reaction_smile")} />}
                                trailing={TableRow.Arrow}
                                arrow
                                onPress={handleNavigateToPresets}
                            />
                        </TableRowGroup>

                        <TableRowGroup title="Account">
                            <TableRow
                                variant="danger"
                                label="Log out"
                                subLabel="Log out of CustomEffects"
                                icon={<TableRow.Icon variant="danger" source={findAssetId("DoorExitIcon")} />}
                                onPress={handleLogout}
                            />
                        </TableRowGroup>
                    </>
                ) : (
                    <TableRowGroup title="Account">
                        <TableRow
                            label="Login"
                            icon={<TableRow.Icon source={findAssetId("Discord")} />}
                            onPress={() => showAuthModal()}
                        />
                    </TableRowGroup>
                )}

                <TableRowGroup title="Info">
                    <TableRow
                        label="Request your own CustomEffect"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        trailing={TableRow.Arrow}
                        onPress={handleOpenDiscord}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
