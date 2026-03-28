import { findByProps } from "@metro";
import { Image, Pressable, View } from "react-native";

const { TextStyleSheet, Text } = findByProps("TextStyleSheet");

// @ts-ignore
export default function EffectCard({ effect, onSelect, selected }) {
    const preview = effect.config.thumbnailPreviewSrc;

    return (
        <Pressable
            onPress={onSelect}
            style={({ pressed }) => ({
                flex: 1,
                margin: 4,
                borderRadius: 16,
                overflow: "hidden",

                borderWidth: selected ? 3 : 0,
                borderColor: selected ? "#5865F2" : "transparent",

                transform: [
                    { scale: pressed ? 0.96 : selected ? 1.02 : 1 }
                ],

                opacity: pressed ? 0.8 : 1
            })}
        >
            <Image
                source={{ uri: preview }}
                style={{
                    width: "100%",
                    aspectRatio: 450 / 880,
                }}
                resizeMode="cover"
            />

            <View style={{ padding: 8 }}>
                <Text
                    style={TextStyleSheet["text-xs/semibold"]}
                    numberOfLines={1}
                >
                    {effect.config.title}
                </Text>
            </View>
        </Pressable>
    );
}
