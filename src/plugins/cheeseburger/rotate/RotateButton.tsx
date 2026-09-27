import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Pressable, Text } from "react-native";

import { isLandscapeLocked, onRotateChange, toggleLandscape } from "./orientation";

let callUi = 0;
const uiListeners = new Set<() => void>();

export const isCallUiOpen = () => callUi > 0;

function useForce(subscribe: (l: () => void) => () => void) {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => subscribe(force), []);
}

const onCallUi = (l: () => void) => {
    uiListeners.add(l);
    return () => void uiListeners.delete(l);
};

export function CallUiTracker() {
    React.useEffect(() => {
        callUi++;
        uiListeners.forEach(l => l());
        return () => {
            callUi--;
            uiListeners.forEach(l => l());
        };
    }, []);
    return null;
}

const icon = () => ["ScreenRotationIcon", "RotateIcon", "DeviceRotateIcon", "ArrowsRotateIcon", "RetryIcon"].map(n => findAssetId(n)).find(id => id !== undefined);

export function RotateButton({ size = 48 }: { size?: number; }) {
    useForce(onRotateChange);
    useForce(onCallUi);
    if (!isCallUiOpen()) return null;

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
                borderRadius: size / 3,
                marginHorizontal: 4,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? "#ffffff" : "rgba(0,0,0,0.55)",
                opacity: pressed ? 0.6 : 1,
            })}
        >
            {src !== undefined
                ? <Image source={src} style={{ width: size * 0.5, height: size * 0.5, tintColor: tint }} />
                : <Text style={{ color: tint, fontSize: size * 0.45 }}>⟳</Text>}
        </Pressable>
    );
}
