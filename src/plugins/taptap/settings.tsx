import { useSettings } from "@api/settings";
import { ReactNative } from "@metro/common";
import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Strings } from "@rain/i18n";
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
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.TAPTAP.BEHAVIOR}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.TAPTAP.REPLY_ON_DOUBLE_TAP}
                        subLabel={Strings.PLUGINS.CUSTOM.TAPTAP.REPLY_ON_DOUBLE_TAP_DESC}
                        value={!!taptapSettings.reply}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ reply: v })}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.TAPTAP.EDIT_OWN_MESSAGES}
                        subLabel={Strings.PLUGINS.CUSTOM.TAPTAP.EDIT_OWN_MESSAGES_DESC}
                        value={!!taptapSettings.userEdit}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ userEdit: v })}
                    />
                    {ReactNative.Platform.OS === "ios" && (
                        <TableSwitchRow
                            label={Strings.PLUGINS.CUSTOM.TAPTAP.TAP_USERNAME_TO_MENTION}
                            subLabel={Strings.PLUGINS.CUSTOM.TAPTAP.USERNAME_TO_MENTION_DESC}
                            value={!!taptapSettings.tapUsernameMention}
                            onValueChange={v => useTapTapSettings.getState().updateSettings({ tapUsernameMention: v })}
                        />
                    )}
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.TAPTAP.OPEN_KEYBOARD_AFTER_ACTION}
                        value={!!taptapSettings.keyboardPopup}
                        onValueChange={v => useTapTapSettings.getState().updateSettings({ keyboardPopup: v })}
                    />
                </TableRowGroup>
                {developerSettings === true && (
                    <TableRowGroup title={Strings.PLUGINS.CUSTOM.TAPTAP.DEBUG}>
                        <TableSwitchRow
                            label={Strings.PLUGINS.CUSTOM.TAPTAP.DEBUG_LOGGING}
                            subLabel={Strings.PLUGINS.CUSTOM.TAPTAP.DEBUG_LOGGING_DESC}
                            value={!!taptapSettings.debugMode}
                            onValueChange={v => useTapTapSettings.getState().updateSettings({ debugMode: v })}
                        />
                    </TableRowGroup>
                )}
            </Stack>
        </View>
    );
}
