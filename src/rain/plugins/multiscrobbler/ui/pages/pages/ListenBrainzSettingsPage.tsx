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

export default function ListenBrainzSettingsPage() {
    const settings = useMultiScrobblerSettings();

    const testConnection = () => {
        showToast(
            "Testing ListenBrainz connection...",
            findAssetId("ClockIcon"),
        );
        serviceFactory.testService("listenbrainz").then((isValid: boolean) => {
            if (isValid) {
                showToast(
                    "✅ ListenBrainz connection successful!",
                    findAssetId("CheckIcon"),
                );
            } else {
                showToast(
                    "❌ ListenBrainz connection failed",
                    findAssetId("XIcon"),
                );
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
                            placeholder="ListenBrainz Username"
                            value={settings.listenbrainzUsername}
                            onChange={(v: string) =>
                                setStorage("listenbrainzUsername", v)
                            }
                            isClearable
                        />
                        <TextInput
                            placeholder="ListenBrainz Token"
                            value={settings.listenbrainzToken}
                            onChange={(v: string) =>
                                setStorage("listenbrainzToken", v)
                            }
                            secureTextEntry={true}
                            isClearable
                        />
                    </Stack>
                </TableRowGroup>

                <TableRowGroup title="Actions">
                    <TableRow
                        label="Test Connection"
                        subLabel="Verify your ListenBrainz credentials"
                        trailing={<TableRow.Arrow />}
                        onPress={testConnection}
                    />
                    <TableRow
                        label="Get User Token"
                        subLabel="Get your ListenBrainz user token at listenbrainz.org/settings/"
                        trailing={<TableRow.Arrow />}
                        onPress={() => {
                            Linking.openURL(
                                "https://listenbrainz.org/settings/",
                            ).catch(() => {
                                showToast(
                                    "Failed to open web browser. Please visit: https://listenbrainz.org/settings/",
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
