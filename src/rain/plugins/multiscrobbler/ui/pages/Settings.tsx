import { NavigationNative } from "@metro/common";
import { ServiceType } from "../../defs";
import { multiScrobblerSettings, useMultiScrobblerSettings } from "../../storage";
import {
    ScrollView,
    Stack,
    TableRadioGroup,
    TableRadioRow,
    TableRow,
    TableRowGroup,
} from "./pages/components/TableComponents";
import DisplaySettingsPage from "./pages/DisplaySettingsPage";
import IgnoreListSettingsPage from "./pages/IgnoreListSettingsPage";
import LastFmSettingsPage from "./pages/LastFmSettingsPage";
import LibreFmSettingsPage from "./pages/LibreFmSettingsPage";
import ListenBrainzSettingsPage from "./pages/ListenBrainzSettingsPage";
import LoggingSettingsPage from "./pages/LoggingSettingsPage";
import RPCCustomizationSettingsPage from "./pages/RPCCustomizationSettingsPage";

export const getStorage = (k: string, fallback?: any) =>
    (multiScrobblerSettings as any)[k] ?? fallback;
export const setStorage = (k: string, v: any) => {
    (multiScrobblerSettings as any)[k] = v;
};

class ServiceFactory {
    static getServiceDisplayName(service: ServiceType): string {
        switch (service) {
            case "lastfm":
                return "Last.fm";
            case "librefm":
                return "Libre.fm";
            case "listenbrainz":
                return "ListenBrainz";
            default:
                return "Unknown";
        }
    }

    static testService(service: ServiceType): Promise<boolean> {
        switch (service) {
            case "lastfm":
                return this.testLastFmConnection();
            case "librefm":
                return this.testLibreFmConnection();
            case "listenbrainz":
                return this.testListenBrainzConnection();
            default:
                return Promise.resolve(false);
        }
    }

    private static testLastFmConnection(): Promise<boolean> {
        const username = getStorage("username");
        const apiKey = getStorage("apiKey");
        if (!username || !apiKey) return Promise.resolve(false);
        return fetch(
            `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`,
        )
            .then(res => res.json())
            .then(data => !data.error)
            .catch(() => false);
    }

    private static testLibreFmConnection(): Promise<boolean> {
        const username = getStorage("librefmUsername");
        const apiKey = getStorage("librefmApiKey");
        if (!username || !apiKey) return Promise.resolve(false);
        return fetch(
            `https://libre.fm/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`,
        )
            .then(res => res.json())
            .then(data => !data.error)
            .catch(() => false);
    }

    private static testListenBrainzConnection(): Promise<boolean> {
        const username = getStorage("listenbrainzUsername");
        const token = getStorage("listenbrainzToken");
        if (!username) return Promise.resolve(false);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Token ${token}`;
        return fetch(
            `https://api.listenbrainz.org/1/user/${username}/listen-count`,
            { headers },
        )
            .then(res => res.status === 200)
            .catch(() => false);
    }
}

export const serviceFactory = ServiceFactory;

export default function Settings() {
    const settings = useMultiScrobblerSettings();
    const navigation = NavigationNative.useNavigation();

    const currentService = settings.service || "lastfm";

    const handleServiceChange = (value: string) => {
        settings.updateSettings({ service: value as ServiceType });
    };

    const getCredentialStatus = (service: ServiceType) => {
        switch (service) {
            case "lastfm":
                return settings.username && settings.apiKey
                    ? "✅ Configured"
                    : "❌ Missing credentials";
            case "librefm":
                return settings.librefmUsername && settings.librefmApiKey
                    ? "✅ Configured"
                    : "❌ Missing credentials";
            case "listenbrainz":
                return settings.listenbrainzUsername
                    ? "✅ Configured"
                    : "❌ Missing username";
            default:
                return "❓ Unknown";
        }
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
              <TableRadioGroup
                  title="Active Service"
                  value={currentService}
                  onChange={handleServiceChange}
              >
                  {(["lastfm", "librefm", "listenbrainz"] as ServiceType[]).map(
                      service => (
                          <TableRadioRow
                              key={service}
                              label={serviceFactory.getServiceDisplayName(service)}
                              subLabel={getCredentialStatus(service)}
                              value={service}
                          />
                      ),
                  )}
              </TableRadioGroup>

                <TableRowGroup title="Service Configuration">
                    <TableRow
                        label="Last.fm Settings"
                        subLabel="Configure Last.fm credentials and options"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Last.fm Settings",
                                render: LastFmSettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="Libre.fm Settings"
                        subLabel="Configure Libre.fm credentials and options"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Libre.fm Settings",
                                render: LibreFmSettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="ListenBrainz Settings"
                        subLabel="Configure ListenBrainz credentials and options"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "ListenBrainz Settings",
                                render: ListenBrainzSettingsPage,
                            })
                        }
                    />
                </TableRowGroup>

                <TableRowGroup title="Plugin Configuration">
                    <TableRow
                        label="Display Settings"
                        subLabel="Customize app name and update interval"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Display Settings",
                                render: DisplaySettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="RPC Customization"
                        subLabel="Customize Discord rich presence display options"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "RPC Customization",
                                render: RPCCustomizationSettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="Ignore List"
                        subLabel="Configure apps that should hide your status"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Ignore List Settings",
                                render: IgnoreListSettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="Logging Settings"
                        subLabel="Configure logging and debugging options"
                        trailing={<TableRow.Arrow />}
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Logging Settings",
                                render: LoggingSettingsPage,
                            })
                        }
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
