import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { ScrollView } from "react-native";

import { API_BASE } from "./lib/api";
import { showAuthModal } from "./lib/showAuthModal";
import { loadAllEffectData } from "./patches/effects";
import { useAuthorizationStore } from "./stores/AuthorizationStore";

export default function CustomEffectSettings() {
    const authStore = useAuthorizationStore();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Account">
                    {authStore.isAuthorized() ? (
                        <>
                            <TableRow
                                label="Logout"
                                icon={<TableRow.Icon source={findAssetId("CircleXIcon")} />}
                                onPress={async () => {
                                    try {
                                        const token = authStore.token;
                                        if (token) {
                                            await fetch(`${API_BASE}/logout`, {
                                                method: "POST",
                                                headers: {
                                                    "Authorization": token,
                                                },
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
                        </>
                    ) : (
                        <TableRow
                            label="Login"
                            icon={<TableRow.Icon source={findAssetId("Discord")} />}
                            onPress={() => showAuthModal()}
                        />
                    )}
                </TableRowGroup>

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
