import { findByProps } from "@metro";
import { Strings } from "@rain/i18n";

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
            <TableRowGroup title={Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.PLATFORM_INDICATOR}>
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.SHOW_ICONS_ON_DM_TOP_BAR}
                    value={settings.dmTopBar ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ dmTopBar: v })}
                />
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.SHOW_ICONS_ON_USERS_DMS_LIST}
                    value={settings.userList ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ userList: v })}
                />
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.SHOW_ICONS_ON_USER_PROFILES}
                    value={settings.profileUsername ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ profileUsername: v })}
                />
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.HODE_MOBILE_STATUS}
                    value={settings.removeDefaultMobile ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ removeDefaultMobile: v })}
                />
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.PLATFORMINDICATORS.THEME_COMPATIBILITY_MODE}
                    value={settings.useThemeColors ?? true}
                    onValueChange={(v: boolean) => usePlatformIndicatorSettings.getState().updateSettings({ useThemeColors: v })}
                />
            </TableRowGroup>
        </Stack>
    );
}
