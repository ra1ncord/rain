import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Pressable, Text } from "react-native";

import { isLandscapeLocked, onRotateChange, toggleLandscape } from "./orientation";

const ICONS = ["ic_screen_rotation", "screen-rotation", "ScreenRotationIcon", "RotateIcon", "ic_rotate", "RetryIcon"];

let iconId: number | null | undefined;
const icon = () => {
    if (iconId === undefined) iconId = ICONS.map(n => findAssetId(n)).find(id => id !== undefined) ?? null;
    return iconId;
};

export function RotateButton({ size = 32 }: { size?: number; }) {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onRotateChange(force), []);

    const on = isLandscapeLocked();
    const src = icon();
    const tint = on ? "#000000" : "#ffffff";

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={on ? "Portrait" : "Landscape"}
            onPress={toggleLandscape}
            hitSlop={8}
            style={({ pressed }) => ({
                width: size,
                height: size,
                borderRadius: size * 0.3,
                marginRight: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? "#ffffff" : "rgba(0,0,0,0.6)",
                opacity: pressed ? 0.6 : 1,
            })}
        >
            {src != null
                ? <Image source={src} style={{ width: size * 0.6, height: size * 0.6, tintColor: tint }} />
                : <Text style={{ color: tint, fontSize: size * 0.55 }}>⟳</Text>}
        </Pressable>
    );
}
