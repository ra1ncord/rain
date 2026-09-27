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

export function RotateFace() {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onRotateChange(force), []);

    const color = isLandscapeLocked() ? "#5865f2" : "#ffffff";
    const src = icon();

    return src != null
        ? <Image source={src} style={{ width: 20, height: 20, tintColor: color }} />
        : <Text style={{ color, fontSize: 18 }}>⟳</Text>;
}

export function TopBarRotate() {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rotate"
            onPress={toggleLandscape}
            hitSlop={6}
            style={({ pressed }) => ({
                position: "absolute",
                top: 0,
                right: "100%",
                marginRight: 12,
                width: 32,
                height: 32,
                borderRadius: 9,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.55)",
                opacity: pressed ? 0.6 : 1,
            })}
        >
            <RotateFace />
        </Pressable>
    );
}
