import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { Linking } from "react-native";

import { clearTrackCache, testConnection } from "../api";
import { useSongSpotlightSettings } from "../storage";

const { ScrollView } = findByProps("ScrollView");
const {
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
const { TextInput } = findByProps("TextInput");

export default function LastFmCredentialsPage() {
    const settings = useSongSpotlightSettings();

    const handleTestConnection = () => {
        showToast("Testing Last.fm connection...", findAssetId("ClockIcon"));
        testConnection().then((isValid: boolean) => {
            if (isValid) {
                showToast("✅ Last.fm connection successful!", findAssetId("CheckIcon"));
            } else {
                showToast("❌ Last.fm connection failed", findAssetId("XIcon"));
            }
        }).catch(() => {
            showToast("❌ Connection error", findAssetId("XIcon"));
        });
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Credentials">
                    <Stack spacing={4}>
                        <TextInput
                            placeholder="Last.fm Username"
                            value={settings.username}
                            onChange={(v: string) =>
                                settings.updateSettings({ username: v })
                            }
                            isClearable
                        />
                        <TextInput
                            placeholder="Last.fm API Key"
                            value={settings.apiKey}
                            onChange={(v: string) =>
                                settings.updateSettings({ apiKey: v })
                            }
                            secureTextEntry={true}
                            isClearable
                        />
                    </Stack>
                </TableRowGroup>

                <TableRowGroup title="Actions">
                    <TableRow
                        label="Test Connection"
                        subLabel="Verify your Last.fm credentials"
                        trailing={<TableRow.Arrow />}
                        onPress={handleTestConnection}
                    />
                    <TableRow
                        label="Get API Key"
                        subLabel="Create a Last.fm API key at last.fm/api/account/create"
                        trailing={<TableRow.Arrow />}
                        onPress={() => {
                            Linking.openURL(
                                "https://www.last.fm/api/account/create",
                            ).catch(() => {
                                showToast(
                                    "Failed to open web browser. Please visit: https://www.last.fm/api/account/create",
                                    findAssetId("XIcon"),
                                );
                            });
                        }}
                    />
                    <TableRow
                        label="Clear Track Cache"
                        subLabel="Force refresh track data on next profile view"
                        trailing={<TableRow.Arrow />}
                        onPress={() => {
                            clearTrackCache();
                            showToast("Track cache cleared", findAssetId("CheckIcon"));
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
