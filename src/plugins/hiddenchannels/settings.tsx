import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useHiddenChannelsSettings } from "./storage";

export default function Settings() {
    const settings = useHiddenChannelsSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Options">
                    <TableSwitchRow
                        label={"Show Lock Icon"}
                        subLabel={"Show a lock icon to the right of hidden channel names."}
                        value={!!settings.showIcon}
                        onValueChange={(v: boolean) => useHiddenChannelsSettings.getState().updateSettings({ showIcon: v })}
                    />
                    <TableSwitchRow
                        label={"Show Popup on Hidden Channels"}
                        subLabel={"Toggle the information popup that appears when selecting hidden channels."}
                        value={!!settings.showPopup}
                        onValueChange={(v: boolean) => useHiddenChannelsSettings.getState().updateSettings({ showPopup: v })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
