import { useMultiScrobblerSettings } from "../../../storage";
import { setStorage } from "../Settings";
import RPCPreview from "./components/RPCPreview";
import {
    ScrollView,
    Stack,
    TableRow,
    TableRowGroup,
    TableSwitchRow,
} from "./components/TableComponents";

export default function RPCCustomizationSettingsPage() {
    const settings = useMultiScrobblerSettings();

    const handleListeningToChange = () => {
        const newValue = !settings.listeningTo;
        setStorage("listeningTo", newValue);

        if (!newValue && settings.showTimestamp) {
            setStorage("showTimestamp", false);
        }
    };

    const handleTimestampChange = () => {
        if (!settings.listeningTo) return;
        setStorage("showTimestamp", !settings.showTimestamp);
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <RPCPreview />
            <Stack spacing={8}>
                <TableRowGroup title="RPC Display Options">
                    <TableSwitchRow
                        label="Show as Listening"
                        subLabel="Display as 'Listening to' instead of 'Playing'"
                        value={settings.listeningTo}
                        onValueChange={handleListeningToChange}
                    />

                    <TableSwitchRow
                        label="Show Tooltip Text"
                        subLabel="Show album name and track duration in Discord activity tooltip"
                        value={settings.showLargeText}
                        onValueChange={(v: boolean) => setStorage("showLargeText", v)}
                    />

                    {!settings.listeningTo && (
                        <TableRow
                            label="Timestamp Unavailable"
                            subLabel="Enable 'Show as Listening' to use timestamp feature"
                            disabled={true}
                            dimmed={true}
                        />
                    )}

                    <TableSwitchRow
                        label="Show Timestamp"
                        subLabel="Display track progress and duration"
                        value={settings.showTimestamp}
                        onValueChange={handleTimestampChange}
                        disabled={!settings.listeningTo}
                    />

                    <TableSwitchRow
                        label="Show Album in Tooltip"
                        subLabel="Include album name in the tooltip text"
                        value={settings.showAlbumInTooltip}
                        onValueChange={(v: boolean) =>
                            setStorage("showAlbumInTooltip", v)
                        }
                    />

                    <TableSwitchRow
                        label="Show Duration in Tooltip"
                        subLabel="Include track duration in the tooltip text"
                        value={settings.showDurationInTooltip}
                        onValueChange={(v: boolean) =>
                            setStorage(
                                "showDurationInTooltip",
                                v,
                            )
                        }
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
