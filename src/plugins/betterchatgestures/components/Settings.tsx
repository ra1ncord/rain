import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { ReactNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup, TableSwitchRow, Text } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { useBetterChatGesturesSettings } from "../storage";

/**
 * Main Settings page implementation
 */
export default () => {
    const { tapUsernameMention, reply, userEdit, delay, updateSettings } = useBetterChatGesturesSettings();

    const isAndroid = ReactNative.Platform.OS === "android";

    // Validate delay input to ensure it's a number
    const handleDelayChange = (value: string) => {
        // Only allow numeric input
        if (/^\d*$/.test(value)) {
            updateSettings({ delay: value });
        }
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                <TableRowGroup title="Preferences">
                    <TableSwitchRow
                        label="Tap Username to Mention"
                        subLabel={`Allows you to tap on a username to mention them instead of opening their profile.${isAndroid ? " This option is disabled on Android." : ""}`}
                        icon={<TableRow.Icon source={findAssetId(tapUsernameMention ? "CheckIcon" : "XIcon")} />}
                        value={isAndroid ? false : tapUsernameMention}
                        onValueChange={() => {
                            if (isAndroid) return;
                            updateSettings({ tapUsernameMention: !tapUsernameMention });
                        }}
                        disabled={isAndroid}
                    />
                    <TableSwitchRow
                        label="Double Tap To Reply"
                        subLabel="Allows you to double tap on any messages to reply to them."
                        icon={<TableRow.Icon source={findAssetId(reply ? "CheckIcon" : "XIcon")} />}
                        value={reply}
                        onValueChange={() => {
                            updateSettings({ reply: !reply });
                        }}
                    />
                    <TableSwitchRow
                        label={`${userEdit ? "Double tap to edit" : "Double tap to reply to"} your own messages`}
                        subLabel={`Allows you to double tap on any of your own messages to ${userEdit ? "edit" : "reply to"} them.`}
                        icon={<TableRow.Icon source={findAssetId(userEdit ? "EditIcon" : "CheckIcon")} />}
                        value={userEdit}
                        onValueChange={() => {
                            updateSettings({ userEdit: !userEdit });
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Settings">
                    <View style={{ padding: 16, alignItems: "flex-start" }}>
                        <Text variant="text-sm/medium">
                           Maximum Delay (ms)
                        </Text>
                    </View>
                    <TableRow
                        label={delay || "1000"}
                        subLabel="Max delay between taps until event is cancelled"
                        onPress={() => showToast("Set value: " + delay, findAssetId("ic_message_retry"))}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};
