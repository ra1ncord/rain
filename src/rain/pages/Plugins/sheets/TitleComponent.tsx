import { Text } from "@metro/common/components";
import { UnifiedPluginModel } from "@rain/pages/Plugins/models";
import { View } from "react-native";

export default function TitleComponent({ plugin }: { plugin: UnifiedPluginModel; }) {
    return <View style={{ gap: 4, marginLeft: 6 }}>
        <View>
            <Text variant="heading-xl/semibold">
                {plugin.name}
            </Text>
        </View>
    </View>;
}
