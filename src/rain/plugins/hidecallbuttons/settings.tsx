import { findByProps } from "@metro";
import { useHideCallButtonsSettings } from "./storage";
import { findAssetId } from "@api/assets";

const { TableRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Stack } = findByProps("Stack");

export default () => {
    const hidecallbuttonsSettings = useHideCallButtonsSettings();

    return (
        <Stack
            style={{ paddingVertical: 24, paddingHorizontal: 12 }}
            spacing={24}
        >
            <TableRowGroup title="User Profile">
                <TableSwitchRow
                    label="Hide call button"
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
                    label="Hide video button"
                    icon={<TableRow.Icon source={findAssetId("VideoIcon")} />}
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ upHideVideoButton: v });
                    }}
                    value={hidecallbuttonsSettings.upHideVideoButton}
                />
            </TableRowGroup>
            <TableRowGroup title="DMs" titleStyleType="no_border">
                <TableSwitchRow
                    label="Hide call button"
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
                    label="Hide video button"
                    icon={<TableRow.Icon source={findAssetId("VideoIcon")} />}
                    onValueChange={(v: boolean) => {
                        useHideCallButtonsSettings
                            .getState()
                            .updateSettings({ dmHideVideoButton: v });
                    }}
                    value={hidecallbuttonsSettings.dmHideVideoButton}
                />
            </TableRowGroup>
            <TableRowGroup title="Other" titleStyleType="no_border">
                <TableSwitchRow
                    label="Hide video button in VC"
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
