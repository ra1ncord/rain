import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Strings } from "@rain/i18n";
import { ScrollView } from "react-native";

import { useHiddenChannelsSettings } from "./storage";

export default function Settings() {
    const settings = useHiddenChannelsSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.OPTIONS}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.SHOW_LOCK_ICON}
                        subLabel={Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.SHOW_LOCK_ICON_DESC}
                        value={!!settings.showIcon}
                        onValueChange={(v: boolean) => useHiddenChannelsSettings.getState().updateSettings({ showIcon: v })}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.SHOW_POPUP}
                        subLabel={Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.SHOW_POPUP_DESC}
                        value={!!settings.showPopup}
                        onValueChange={(v: boolean) => useHiddenChannelsSettings.getState().updateSettings({ showPopup: v })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
