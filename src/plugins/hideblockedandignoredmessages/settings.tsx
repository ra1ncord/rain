import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { useHideBlockedAndIgnoredMessagesSettings } from "./storage";

export default function Settings() {
    const settings = useHideBlockedAndIgnoredMessagesSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <View>
                    <TableRowGroup title="HideBlockedAndIgnoredMessages">
                        <TableSwitchRow
                            label="Remove blocked messages"
                            value={settings.blocked ?? true}
                            onValueChange={(v: boolean) =>
                                useHideBlockedAndIgnoredMessagesSettings
                                    .getState()
                                    .updateSettings({ blocked: v })
                            }
                        />
                        <TableSwitchRow
                            label="Remove ignored messages"
                            value={settings.ignored ?? true}
                            onValueChange={(v: boolean) =>
                                useHideBlockedAndIgnoredMessagesSettings
                                    .getState()
                                    .updateSettings({ ignored: v })
                            }
                        />
                        <TableSwitchRow
                            label="Remove replies to blocked/ignored users"
                            value={settings.removeReplies ?? true}
                            onValueChange={(v: boolean) =>
                                useHideBlockedAndIgnoredMessagesSettings
                                    .getState()
                                    .updateSettings({ removeReplies: v })
                            }
                            subLabel="Filters messages replying to blocked or ignored users."
                        />
                    </TableRowGroup>
                </View>
            </Stack>
        </ScrollView>
    );
}
