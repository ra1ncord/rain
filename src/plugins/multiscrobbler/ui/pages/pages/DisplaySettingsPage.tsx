import Constants from "../../../constants";
import { useMultiScrobblerSettings } from "../../../storage";
import { setStorage } from "../Settings";
import {
    Card,
    ScrollView,
    SliderRow,
    Stack,
    TableRow,
    TableRowGroup,
    TextInput,
} from "./components/TableComponents";

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
                        <Card style={{ padding: 16 }}>
                            <SliderRow
                                label="Update Interval"
                                value={settings.timeInterval}
                                minimumValue={Constants.MIN_UPDATE_INTERVAL}
                                maximumValue={Constants.MAX_UPDATE_INTERVAL}
                                suffix="s"
                                onChange={(v: number) => setStorage("timeInterval", v)}
                            />
                        </Card>
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
