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

export default function LibreFmSettingsPage() {
    const settings = useMultiScrobblerSettings();

    const testConnection = () => {
        showToast("Testing Libre.fm connection...", findAssetId("ClockIcon"));
        serviceFactory.testService("librefm").then((isValid: boolean) => {
            if (isValid) {
                showToast(
                    "✅ Libre.fm connection successful!",
                    findAssetId("CheckIcon"),
                );
            } else {
                showToast("❌ Libre.fm connection failed", findAssetId("XIcon"));
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
                            placeholder="Libre.fm Username"
                            value={settings.librefmUsername}
                            onChange={(v: string) =>
                                setStorage("librefmUsername", v)
                            }
                            isClearable
                        />
                        <TextInput
                            placeholder="Libre.fm API Key"
                            value={settings.librefmApiKey}
                            onChange={(v: string) =>
                                setStorage("librefmApiKey", v)
                            }
                            secureTextEntry={true}
                            isClearable
                        />
                    </Stack>
                </TableRowGroup>

                <TableRowGroup title="Actions">
                    <TableRow
                        label="Test Connection"
                        subLabel="Verify your Libre.fm credentials"
                        trailing={<TableRow.Arrow />}
                        onPress={testConnection}
                    />
                    <TableRow
                        label="Get API Key"
                        subLabel="Create a Last.fm API key (compatible with Libre.fm)"
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
