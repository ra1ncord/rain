import { findAssetId } from "@api/assets";
import { findByProps } from "@metro";
import { Strings } from "@rain/i18n";

import { useHideCallButtonsSettings } from "./storage";

const { TableRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Stack } = findByProps("Stack");

export default () => {
    const hidecallbuttonsSettings = useHideCallButtonsSettings();

    return (
        <Stack
            style={{ paddingVertical: 24, paddingHorizontal: 12 }}
            spacing={24}
        >
            <TableRowGroup title={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.USER_PROFILE}>
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.HIDE_CALL_BUTTON}
                    icon={
                        <TableRow.Icon source={findAssetId("PhoneCallIcon")} />
                    }
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ upHideVoiceButton: v });
                    }}
                    value={hidecallbuttonsSettings.upHideVoiceButton}
                />
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.HIDE_VIDEO_BUTTON}
                    icon={<TableRow.Icon source={findAssetId("VideoIcon")} />}
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ upHideVideoButton: v });
                    }}
                    value={hidecallbuttonsSettings.upHideVideoButton}
                />
            </TableRowGroup>
            <TableRowGroup title={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.DMS} titleStyleType="no_border">
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.HIDE_CALL_BUTTON}
                    icon={
                        <TableRow.Icon source={findAssetId("PhoneCallIcon")} />
                    }
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ dmHideCallButton: v });
                    }}
                    value={hidecallbuttonsSettings.dmHideCallButton}
                />
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.HIDE_VIDEO_BUTTON}
                    icon={<TableRow.Icon source={findAssetId("VideoIcon")} />}
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ dmHideVideoButton: v });
                    }}
                    value={hidecallbuttonsSettings.dmHideVideoButton}
                />
            </TableRowGroup>
            <TableRowGroup title={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.OTHER} titleStyleType="no_border">
                <TableSwitchRow
                    label={Strings.PLUGINS.CUSTOM.HIDECALLBUTTONS.HIDE_VIDEO_BUTTON_IN_VC}
                    icon={<TableRow.Icon source={findAssetId("VideoIcon")} />}
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ hideVCVideoButton: v });
                    }}
                    value={hidecallbuttonsSettings.hideVCVideoButton}
                />
            </TableRowGroup>
        </Stack>
    );
};
