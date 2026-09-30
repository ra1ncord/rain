import { findAssetId } from "@api/assets";
import { showSheet } from "@api/ui/sheets";
import { React } from "@metro/common";
import { Image, Pressable, Text, View } from "react-native";

import { safe } from "../crash";
import { DEFAULT_ICON_SIZE, useCallLook } from "../look";
import { accentColor } from "../style/colors";
import { ToolbarButton } from "../toolbar";
import { ArrangeSheet } from "./Arrange";
import { isSplitActive, onSplitChange, setSplitActive, toggleSplit } from "./layout";
import { useToolbarRef } from "./probe";
import { useSplitViewSettings } from "./storage";

const firstAsset = (...names: string[]) => names.map(n => findAssetId(n)).find(id => id !== undefined);

const press = safe("split press", () => toggleSplit());
const hold = safe("split hold", () => {
    if (!isSplitActive()) setSplitActive(true);
    showSheet("CheeseburgerArrange", ArrangeSheet);
});

export function SplitViewButton() {
    const { showButton, iconSize } = useSplitViewSettings();
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onSplitChange(force), []);
    const ref = useToolbarRef();
    const look = useCallLook();
    if (!showButton) return null;

    const active = isSplitActive();
    const icon = firstAsset("GridSquareIcon", "GridVerticalIcon", "LayoutIcon", "ArrowsUpDownIcon");
    const custom = Number(iconSize);
    const d = custom && custom !== DEFAULT_ICON_SIZE ? custom : look.size;
    const color = active ? accentColor() : look.tint;

    const plain = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Split view"
            onPress={press}
            onLongPress={hold}
            delayLongPress={350}
            hitSlop={12}
            style={({ pressed }) => ({ minWidth: 48, height: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.5 : 1 })}
        >
            {icon !== undefined
                ? <Image source={icon} style={{ width: d, height: d, tintColor: color }} />
                : <Text style={{ color, fontSize: d * 0.8 }}>⇅</Text>}
        </Pressable>
    );

    return (
        <View ref={ref} collapsable={false}>
            <ToolbarButton
                icon={["GridSquareIcon", "GridVerticalIcon", "LayoutIcon"]}
                label="Split view"
                onPress={press}
                onLongPress={hold}
                color={active ? accentColor() : undefined}
                fallback={plain}
            />
        </View>
    );
}
