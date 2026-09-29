import { findAssetId } from "@api/assets";
import { showSheet } from "@api/ui/sheets";
import { React } from "@metro/common";
import { Image, Pressable, Text } from "react-native";

import { accentColor } from "../style/colors";
import { ArrangeSheet } from "./Arrange";
import { isSplitActive, onSplitChange, setSplitActive, toggleSplit } from "./layout";
import { useToolbarRef } from "./probe";
import { useSplitViewSettings } from "./storage";

const firstAsset = (...names: string[]) => names.map(n => findAssetId(n)).find(id => id !== undefined);


export function SplitViewButton() {
    const { showButton, iconSize } = useSplitViewSettings();
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onSplitChange(force), []);
    const ref = useToolbarRef();
    if (!showButton) return null;

    const active = isSplitActive();
    const icon = firstAsset("GridSquareIcon", "GridVerticalIcon", "LayoutIcon", "ArrowsUpDownIcon");
    const d = Number(iconSize) || 26;
    const color = active ? accentColor() : "#ffffff";

    return (
        <Pressable
            ref={ref}
            accessibilityRole="button"
            accessibilityLabel="Split view"
            onPress={toggleSplit}
            onLongPress={() => {
                if (!isSplitActive()) setSplitActive(true);
                showSheet("CheeseburgerArrange", ArrangeSheet);
            }}
            delayLongPress={350}
            hitSlop={12}
            style={({ pressed }) => ({ minWidth: 48, height: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.5 : 1 })}
        >
            {icon !== undefined
                ? <Image source={icon} style={{ width: d, height: d, tintColor: color }} />
                : <Text style={{ color, fontSize: d * 0.8 }}>⇅</Text>}
        </Pressable>
    );
}
