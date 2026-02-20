import {
    ScrollView,
    Stack,
    TableRowGroup,
    TableCheckboxRow,
    TableRow,
} from "./components/TableComponents";
import { setStorage } from "../Settings";
import RPCPreview from "./components/RPCPreview";
import { useMultiScrobblerSettings } from "../../../storage";

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
                    <TableCheckboxRow
                        label="Show as Listening"
                        subLabel="Display as 'Listening to' instead of 'Playing'"
                        checked={settings.listeningTo}
                        onPress={handleListeningToChange}
                    />

                    <TableCheckboxRow
                        label="Show Tooltip Text"
                        subLabel="Show album name and track duration in Discord activity tooltip"
                        checked={settings.showLargeText}
                        onPress={() => setStorage("showLargeText", !settings.showLargeText)}
                    />

                    {!settings.listeningTo && (
                        <TableRow
                            label="Timestamp Unavailable"
                            subLabel="Enable 'Show as Listening' to use timestamp feature"
                            disabled={true}
                            dimmed={true}
                        />
                    )}

                    <TableCheckboxRow
                        label="Show Timestamp"
                        subLabel="Display track progress and duration"
                        checked={settings.showTimestamp}
                        onPress={handleTimestampChange}
                        disabled={!settings.listeningTo}
                    />

                    <TableCheckboxRow
                        label="Show Album in Tooltip"
                        subLabel="Include album name in the tooltip text"
                        checked={settings.showAlbumInTooltip}
                        onPress={() =>
                            setStorage("showAlbumInTooltip", !settings.showAlbumInTooltip)
                        }
                    />

                    <TableCheckboxRow
                        label="Show Duration in Tooltip"
                        subLabel="Include track duration in the tooltip text"
                        checked={settings.showDurationInTooltip}
                        onPress={() =>
                            setStorage(
                                "showDurationInTooltip",
                                !settings.showDurationInTooltip,
                            )
                        }
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
