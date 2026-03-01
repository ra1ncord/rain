import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { findByProps, findByStoreName } from "@metro";
import { NavigationNative } from "@metro/common";
import { Text } from "@metro/common/components";

import { publishToRegistry, unpublishFromRegistry } from "./api";
import SongSection from "./components/SongSection";
import DisplaySettingsPage from "./pages/DisplaySettingsPage";
import LastFmCredentialsPage from "./pages/LastFmCredentialsPage";
import { useSongSpotlightSettings } from "./storage";

const { ScrollView } = findByProps("ScrollView");
const {
    TableSwitchRow,
    TableRowGroup,
    TableRow,
    Stack,
} = findByProps(
    "TableSwitchRow",
    "TableRowGroup",
    "Stack",
    "TableRow",
    "TableRadioRow",
    "TableRadioGroup",
);
const UserStore = findByStoreName("UserStore");

export default function Settings() {
    const settings = useSongSpotlightSettings();
    const navigation = NavigationNative.useNavigation();

    const credentialStatus = settings.username && settings.apiKey
        ? "✅ Authenticated"
        : "❌ Missing credentials";

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Service Configuration">
                    <TableRow
                        label="Last.fm Settings"
                        subLabel={credentialStatus}
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Last.fm Settings",
                                render: LastFmCredentialsPage,
                            })
                        }
                    />
                </TableRowGroup>

                <TableRowGroup title="Display">
                    <TableRow
                        label="Configure display"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Display",
                                render: DisplaySettingsPage,
                            })
                        }
                    />
                </TableRowGroup>

                <TableRowGroup title="Sharing">
                    <TableSwitchRow
                        label="Share my Last.fm username"
                        subLabel="Allow other Rain users to see your top tracks on your profile. Your Discord ID and Last.fm username will be stored in a public registry."
                        onValueChange={(value: boolean) => {
                            settings.updateSettings({ shareUsername: value });
                            const myId = UserStore?.getCurrentUser?.()?.id;
                            if (!value) {
                                if (myId) {
                                    unpublishFromRegistry(myId).then(ok => {
                                        if (ok) showToast("Removed from registry", findAssetId("CheckIcon"));
                                    });
                                }
                            } else if (settings.username && myId) {
                                publishToRegistry(myId).then(ok => {
                                    if (ok) showToast("Published to registry!", findAssetId("CheckIcon"));
                                    else showToast("Failed to publish", findAssetId("XIcon"));
                                });
                            }
                        }}
                        value={settings.shareUsername}
                    />
                    <TableRow
                        label="Publish Now"
                        subLabel="Manually sync your Last.fm username to the registry"
                        trailing={<TableRow.Arrow />}
                        onPress={() => {
                            if (!settings.username) {
                                showToast("Set your Last.fm username first", findAssetId("XIcon"));
                                return;
                            }
                            const myId = UserStore?.getCurrentUser?.()?.id;
                            if (!myId) {
                                showToast("Not logged in", findAssetId("XIcon"));
                                return;
                            }
                            showToast("Publishing...", findAssetId("ClockIcon"));
                            publishToRegistry(myId).then(ok => {
                                if (ok) {
                                    settings.updateSettings({ shareUsername: true });
                                    showToast("Published to registry!", findAssetId("CheckIcon"));
                                } else {
                                    showToast("Failed to publish", findAssetId("XIcon"));
                                }
                            });
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Preview">
                    <Stack spacing={0}>
                        {UserStore?.getCurrentUser?.()?.id ? (
                            <SongSection userId={UserStore.getCurrentUser().id} />
                        ) : (
                            <Text variant="text-sm/medium" style={{ textAlign: "center", paddingVertical: 16 }}>
                                Log in to see preview
                            </Text>
                        )}
                    </Stack>
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
