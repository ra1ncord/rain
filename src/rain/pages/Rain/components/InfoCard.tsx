import { Card, Text } from "@metro/common/components";
import { type StyleProp, View, type ViewStyle } from "react-native";

interface InfoCardProps {
    icon?: React.ReactElement;
    title: string;
    style?: StyleProp<ViewStyle>;
    trailing?: React.ReactElement | string;
    tag?: string;
    onPress: () => void;
}

// Basically taken from wintry: https://github.com/amsryq/wintry/blob/main/src/components/Wintry/Settings/pages/Wintry/InfoCard.tsx
export function InfoCard({ title, style, icon, tag, onPress, trailing }: InfoCardProps) {
    return (
        <Card style={style} onPress={onPress}>
            <View style={{ gap: 8 }}>
                {tag && (
                    <View style={{ position: "absolute", top: -28, right: -18 }}>
                        <Text variant="text-xs/semibold" color="text-positive">{tag}</Text>
                    </View>
                )}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {icon}
                    {typeof trailing === "string" ? (
                        <Text
                            numberOfLines={2}
                            style={{ textAlign: "right" }}
                            variant="text-sm/medium"
                            color="text-muted"
                        >
                            {trailing}
                        </Text>
                    ) : (
                        <View style={{ alignSelf: "center" }}>
                            {trailing}
                        </View>
                    )}
                </View>
                <Text variant="heading-md/semibold">{title}</Text>
            </View>
        </Card>
    );
}
