import { useSettings } from "@api/settings";
import { ReactNative } from "@metro/common";
import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { View } from "react-native";

import { useTapTapSettings } from "./storage";

export default function TapTapSettings() {
    const { developerSettings } = useSettings();
    const taptapSettings = useTapTapSettings();

    const [delayStr, setDelayStr] = React.useState(taptapSettings.delay ?? "300");

    React.useEffect(() => {
        setDelayStr(taptapSettings.delay ?? "300");
    }, [taptapSettings.delay]);

    const applyDelay = React.useCallback((val: string) => {
        const parsed = parseInt(val, 10);
        if (!Number.isNaN(parsed)) {
            const clamped = Math.max(150, parsed);
            useTapTapSettings.getState().updateSettings({ delay: String(clamped) });
        }
    }, []);

    return (
        <View>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={"Behavior"}>
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
                    {ReactNative.Platform.OS === "ios" && (
                        <TableSwitchRow
                            label="Tap username to mention"
                            subLabel="Tap a username to insert an @mention into the chat input"
                            value={!!taptapSettings.tapUsernameMention}
                            onValueChange={v => useTapTapSettings.getState().updateSettings({ tapUsernameMention: v })}
                        />
                    )}
                    <TableSwitchRow
                        label="Open keyboard after action"
                        value={!!taptapSettings.keyboardPopup}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ keyboardPopup: v })}
                    />
                </TableRowGroup>
                {developerSettings === true && (
                    <TableRowGroup title={"Debug"}>
                        <TableSwitchRow
                            label="Debug logging"
                            subLabel="Log gesture state to console"
                            value={!!taptapSettings.debugMode}
                            onValueChange={v => useTapTapSettings.getState().updateSettings({ debugMode: v })}
                        />
                    </TableRowGroup>
                )}
            </Stack>
        </View>
    );
}
