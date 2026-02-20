import {
    ScrollView,
    Stack,
    TableRowGroup,
    TableRow,
    TextInput,
} from "./components/TableComponents";
import Constants from "../../../constants";
import { setStorage } from "../Settings";
import { useMultiScrobblerSettings } from "../../../storage";

export default function DisplaySettingsPage() {
    const settings = useMultiScrobblerSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Activity Display">
                    <Stack spacing={4}>
                        <TextInput
                            placeholder={`App Name (Default: ${Constants.DEFAULT_SETTINGS.appName})`}
                            value={settings.appName}
                            onChange={(v: string) => setStorage("appName", v)}
                            isClearable
                        />
                        <TextInput
                            placeholder={`Update Interval (Default: ${Constants.DEFAULT_SETTINGS.timeInterval}s)`}
                            value={String(settings.timeInterval)}
                            onChange={(v: string) => {
                                const interval = Number(v);
                                if (interval >= Constants.MIN_UPDATE_INTERVAL) {
                                    setStorage("timeInterval", interval);
                                }
                            }}
                            keyboardType="numeric"
                            isClearable
                        />
                    </Stack>
                </TableRowGroup>

                <TableRowGroup title="About Display Settings">
                    <TableRow
                        label="App Name"
                        subLabel="The name shown in Discord for your activity"
                    />
                    <TableRow
                        label="Update Interval"
                        subLabel="How often the plugin checks for new tracks (in seconds)"
                    />
                    <TableRow
                        label="Minimum Interval"
                        subLabel={`The plugin will never check more frequently than ${Constants.MIN_UPDATE_INTERVAL} seconds`}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
