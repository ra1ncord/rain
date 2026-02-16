import { findByProps } from "@metro";

import { usePlatformIndicatorSettings } from "./storage";

const { TableSwitchRow, TableRowGroup } = findByProps("TableSwitchRow");
const { Stack } = findByProps("Stack");

export default function Settings() {
    const settings = usePlatformIndicatorSettings();

    return (
        <Stack
            style={{ paddingVertical: 24, paddingHorizontal: 12 }}
            spacing={24}
        >
            <TableRowGroup title="Platform Indicator">
                <TableSwitchRow
                    label="Show icons on the dm top bar"
                    value={settings.dmTopBar ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ dmTopBar: v })}
                />
                <TableSwitchRow
                    label="Show icons on the users and DMs list"
                    value={settings.userList ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ userList: v })}
                />
                <TableSwitchRow
                    label="Show icons on user profiles"
                    value={settings.profileUsername ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ profileUsername: v })}
                />
                <TableSwitchRow
                    label="Hide mobile status from the normal indicator"
                    value={settings.removeDefaultMobile ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ removeDefaultMobile: v })}
                />
                <TableSwitchRow
                    label="Theme compatibility mode"
                    value={settings.useThemeColors ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ useThemeColors: v })}
                />
            </TableRowGroup>
        </Stack>
    );
}
