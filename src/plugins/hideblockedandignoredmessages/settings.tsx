import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView, View } from "react-native";
import { Strings } from "@rain/i18n";

import { useHideBlockedAndIgnoredMessagesSettings } from "./storage";

export default function Settings() {
    const settings = useHideBlockedAndIgnoredMessagesSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <View>
                    <TableRowGroup title={Strings.PLUGINS.CUSTOM.HIDEBLOCKEDANDIGNOREDMESSAGES.NAME}>
                        <TableSwitchRow
                            label={Strings.PLUGINS.CUSTOM.HIDEBLOCKEDANDIGNOREDMESSAGES.REMOVE_BLOCKED_MESSAGES}
                            value={settings.blocked ?? true}
                            onValueChange={(v: boolean) =>
                                useHideBlockedAndIgnoredMessagesSettings
                                    .getState()
                                    .updateSettings({ blocked: v })
                            }
                        />
                        <TableSwitchRow
                            label={Strings.PLUGINS.CUSTOM.HIDEBLOCKEDANDIGNOREDMESSAGES.REMOVE_IGNORED_MESSAGES}
                            value={settings.ignored ?? true}
                            onValueChange={(v: boolean) =>
                                useHideBlockedAndIgnoredMessagesSettings
                                    .getState()
                                    .updateSettings({ ignored: v })
                            }
                        />
                        <TableSwitchRow
                            label={Strings.PLUGINS.CUSTOM.HIDEBLOCKEDANDIGNOREDMESSAGES.REMOVE_REPLIES_TO_MESSAGES}
                            value={settings.removeReplies ?? true}
                            onValueChange={(v: boolean) =>
                                useHideBlockedAndIgnoredMessagesSettings
                                    .getState()
                                    .updateSettings({ removeReplies: v })
                            }
                            subLabel={Strings.PLUGINS.CUSTOM.HIDEBLOCKEDANDIGNOREDMESSAGES.REMOVE_REPLIES_TO_MESSAGES_DESC}
                        />
                    </TableRowGroup>
                </View>
            </Stack>
        </ScrollView>
    );
}
