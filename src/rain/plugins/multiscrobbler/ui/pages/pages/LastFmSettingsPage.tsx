import { Linking } from "react-native";
import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import {
    ScrollView,
    Stack,
    TableRowGroup,
    TableRow,
    TextInput,
} from "./components/TableComponents";
import { serviceFactory, setStorage } from "../Settings";
import { useMultiScrobblerSettings } from "../../../storage";

export default function LastFmSettingsPage() {
    const settings = useMultiScrobblerSettings();

    const testConnection = () => {
        showToast("Testing Last.fm connection...", findAssetId("ClockIcon"));
        serviceFactory.testService("lastfm").then((isValid: boolean) => {
            if (isValid) {
                showToast(
                    "✅ Last.fm connection successful!",
                    findAssetId("CheckIcon"),
                );
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
                            onChange={(v: string) => setStorage("username", v)}
                            isClearable
                        />
                        <TextInput
                            placeholder="Last.fm API Key"
                            value={settings.apiKey}
                            onChange={(v: string) => setStorage("apiKey", v)}
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
                        onPress={testConnection}
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
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
