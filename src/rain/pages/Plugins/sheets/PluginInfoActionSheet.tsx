import { findAssetId } from "@api/assets";
import { useSettings } from "@api/settings";
import { semanticColors } from "@api/ui/components/color";
import { ActionSheet, Card, IconButton, Text } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { PluginInfoActionSheetProps } from "./common";
import TitleComponent from "./TitleComponent";

export default function PluginInfoActionSheet({
    plugin,
    navigation,
}: PluginInfoActionSheetProps) {
    plugin.usePluginState?.();
    const { pinnedPlugins, togglePinnedPlugin } = useSettings();
    const isPinned = pinnedPlugins?.includes(plugin.id);

    return (
        <ActionSheet>
            <ScrollView contentContainerStyle={{ gap: 0, marginBottom: 12 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingVertical: 24,
                        paddingHorizontal: 16,
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <TitleComponent plugin={plugin} />
                    </View>

                    <IconButton
                        size="sm"
                        variant="secondary"
                        icon={findAssetId(isPinned ? "TrashIcon" : "PinIcon")}
                        style={{
                            borderRadius: 100,
                            backgroundColor: isPinned ? semanticColors.BACKGROUND_MODIFIER_ACCENT : "transparent",
                        }}
                        onPress={() => {
                            togglePinnedPlugin(plugin.id);
                        }}
                    />
                </View>

                <Card>
                    <Text
                        variant="text-md/semibold"
                        style={{
                            marginBottom: 4,
                            color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
                        }}
                    >
                        Description
                    </Text>
                    <Text variant="text-md/medium">{plugin.description}</Text>
                </Card>
            </ScrollView>
        </ActionSheet>
    );
}
