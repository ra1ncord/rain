import { useSettings } from "@api/settings";
import { Stack, TableRadioGroup, TableRadioRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useTapTapSettings } from "./storage";

export default function TapTapSettings() {
    const { developerSettings } = useSettings();
    const taptapSettings = useTapTapSettings();

    return (
        <ScrollView>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Behavior">
                    <TableSwitchRow
                        label="Reply on double-tap"
                        subLabel="Creates a pending reply when double-tapping messages"
                        value={!!taptapSettings.reply}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ reply: v })}
                    />
                    <TableSwitchRow
                        label="Edit own messages"
                        subLabel="Double-tap your own messages to edit"
                        value={!!taptapSettings.userEdit}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ userEdit: v })}
                    />
                    <TableSwitchRow
                        label="Open keyboard after action"
                        value={!!taptapSettings.keyboardPopup}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ keyboardPopup: v })}
                    />
                </TableRowGroup>
                <TableRadioGroup
                    title="Tap Username Action"
                    value={taptapSettings.tapUsernameAction}
                    onChange={(value: string) => useTapTapSettings.getState().updateSettings({ tapUsernameAction: value })}
                >
                    <TableRadioRow
                        label="Insert @mention"
                        value="mention"
                    />
                    <TableRadioRow
                        label="Open profile"
                        value="profile"
                    />
                </TableRadioGroup>
                {developerSettings === true && (
                    <TableRowGroup title="Debug">
                        <TableSwitchRow
                            label="Debug logging"
                            subLabel="Log gesture state to console"
                            value={!!taptapSettings.debugMode}
                            onValueChange={v => useTapTapSettings.getState().updateSettings({ debugMode: v })}
                        />
                    </TableRowGroup>
                )}
            </Stack>
        </ScrollView>
    );
}
