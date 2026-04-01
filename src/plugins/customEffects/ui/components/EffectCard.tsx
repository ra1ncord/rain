import { findByProps } from "@metro";
import React from "react";
import { Image, Pressable, View } from "react-native";

const { TextStyleSheet, Text } = findByProps("TextStyleSheet");

// @ts-ignore
function EffectCardComponent({ effect, onSelect, selected }) {
    const preview = React.useMemo(() => effect.config.thumbnailPreviewSrc, [effect]);
    const title = React.useMemo(() => effect.config.title, [effect]);

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
                    {title}
                </Text>
            </View>
        </Pressable>
    );
}

export default React.memo(EffectCardComponent, (prevProps, nextProps) => {
    return (
        prevProps.selected === nextProps.selected &&
        prevProps.effect.skuId === nextProps.effect.skuId &&
        prevProps.onSelect === nextProps.onSelect
    );
});
