import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Text } from "react-native";

import { isLandscapeLocked, onRotateChange } from "./orientation";

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
