import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { NavigationNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

import { API_BASE, apiFetch } from "./lib/api";
import { showAuthModal } from "./lib/showAuthModal";
import { loadAllEffectData } from "./patches/effects";
import { useAuthorizationStore } from "./stores/AuthorizationStore";
import MyEffects from "./ui/pages/myeffects";
import Presets from "./ui/pages/presets";

export default function CustomEffectSettings() {
    const authStore = useAuthorizationStore();
    const navigation = NavigationNative.useNavigation();
    const [hasEffects, setHasEffects] = React.useState(false);
    const [selectedEffect, setSelectedEffect] = React.useState<string | null>(null);

    React.useEffect(() => {
        (async () => {
            try {
                const me = await apiFetch("/me", { method: "POST" });
                setSelectedEffect(me.data.selected);
            } catch (e) {
                console.error("Failed to fetch user info", e);
            }
        })();
    }, []);

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
                                onPress={async () => {
                                    if (!selectedEffect) return;

                                    await apiFetch("/set-effect", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ effectId: null }),
                                    });

                                    setSelectedEffect(null);
                                    showToast("Effect removed", findAssetId("CheckIcon"));
                                }}
                            />
                            {hasEffects && (
                                <TableRow
                                    label="Your Effects"
                                    subLabel="Your approved effects"
                                    icon={<TableRow.Icon source={findAssetId("ic_reaction_smile")} />}
                                    trailing={TableRow.Arrow}
                                    arrow
                                    onPress={() =>
                                        navigation.push("RAIN_CUSTOM_PAGE", {
                                            title: "Your Effects",
                                            render: MyEffects,
                                        })
                                    }
                                />
                            )}
                            <TableRow
                                label="Browse Presets"
                                subLabel="Browse through presets"
                                icon={<TableRow.Icon source={findAssetId("ic_reaction_smile")} />}
                                trailing={TableRow.Arrow}
                                arrow
                                onPress={() =>
                                    navigation.push("RAIN_CUSTOM_PAGE", {
                                        title: "Presets",
                                        render: Presets,
                                    })
                                }
                            />
                        </TableRowGroup>

                        <TableRowGroup title="Account">
                            <TableRow
                                variant="danger"
                                label="Log out"
                                subLabel="Log out of CustomEffects"
                                icon={<TableRow.Icon variant="danger" source={findAssetId("DoorExitIcon")} />}
                                onPress={async () => {
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
                                }}
                            />
                            <TableRow
                                label="Reload Effects DB"
                                icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                                onPress={async () => {
                                    await loadAllEffectData();
                                    showToast("Reloaded effects", findAssetId("CheckIcon"));
                                }}
                            />
                        </TableRowGroup>
                    </>
                ) : (
                    <TableRow
                        label="Login"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        onPress={() => showAuthModal()}
                    />
                )}

                <TableRowGroup title="Info">
                    <TableRow
                        label="Request your own CustomEffect"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        trailing={TableRow.Arrow}
                        onPress={() => {
                            const { Linking } = require("react-native");
                            Linking.openURL("https://discord.gg/FGzGgph4Vm");
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
