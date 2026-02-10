import { hideSheet } from "@api/ui/sheets";
import { ActionSheet, Card, IconButton, Text } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { PluginInfoActionSheetProps } from "./common";
import TitleComponent from "./TitleComponent";

function PluginInfoIconButton(props) {
    const { onPress } = props;
    props.onPress &&= () => {
        hideSheet("PluginInfoActionSheet");
        onPress?.();
    };
    return <IconButton {...props} />;
}

export default function PluginInfoActionSheet({
    plugin,
    navigation,
}: PluginInfoActionSheetProps) {
    plugin.usePluginState?.();

    return (
        <ActionSheet>
            <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingVertical: 24,
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <TitleComponent plugin={plugin} />
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 22,
                        paddingHorizontal: 4,
                    }}
                >
                </View>
                <Card>
                    <Text
                        variant="text-md/semibold"
                        color="text-primary"
                        style={{
                            marginBottom: 4,
                            color: "text-strong",
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
