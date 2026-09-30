import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Pressable, Text } from "react-native";

import { safe } from "../crash";
import { useHeaderRef } from "../split/probe";
import { useCheeseburger } from "../storage";
import { Notches } from "../style";
import { accentColor, baseColor } from "../style/colors";
import { styleSettings } from "../style/storage";
import { isLandscapeLocked, onRotateChange, toggleLandscape } from "./orientation";

const ICONS = ["ic_screen_rotation", "screen-rotation", "ScreenRotationIcon", "RotateIcon", "ic_rotate", "RetryIcon"];

const rotate = safe("rotate press", () => toggleLandscape());

let iconId: number | null | undefined;
const icon = () => {
    if (iconId === undefined) iconId = ICONS.map(n => findAssetId(n)).find(id => id !== undefined) ?? null;
    return iconId;
};

export function RotateFace() {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onRotateChange(force), []);

    const color = isLandscapeLocked() ? accentColor() : "#ffffff";
    const src = icon();

    return src != null
        ? <Image source={src} style={{ width: 20, height: 20, tintColor: color }} />
        : <Text style={{ color, fontSize: 18 }}>⟳</Text>;
}

export function TopBarRotate() {
    const ref = useHeaderRef();
    const styled = useCheeseburger(s => s.style);
    const base = styled ? baseColor() : undefined;
    const size = Math.max(4, Number(styleSettings.bevelSize) || 8);
    return (
        <Pressable
            ref={ref}
            accessibilityRole="button"
            accessibilityLabel="Rotate"
            onPress={rotate}
            hitSlop={6}
            style={({ pressed }) => ({
                position: "absolute",
                top: 0,
                right: "100%",
                marginRight: 12,
                width: 32,
                height: 32,
                borderRadius: base ? 0 : 9,
                borderTopRightRadius: base ? 4 : 9,
                borderBottomLeftRadius: base ? 4 : 9,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.55)",
                opacity: pressed ? 0.6 : 1,
            })}
        >
            <RotateFace />
            {base && <Notches size={Math.min(size, 10)} color={base} />}
        </Pressable>
    );
}
