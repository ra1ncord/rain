import { findAssetId } from "@api/assets";
import { showSheet } from "@api/ui/sheets";
import { React } from "@metro/common";
import { ActionSheet, BottomSheetTitleHeader, IconButton, TableRow, TableRowGroup } from "@metro/common/components";
import { Image, Pressable, Text, View } from "react-native";

import { isLandscapeLocked, onRotateChange, toggleLandscape } from "../rotate/orientation";
import { useCheeseburger } from "../storage";
import { isSplitActive, onSplitChange, setSplitActive, toggleSplit } from "./layout";
import { useSplitViewSettings } from "./storage";
import { currentOrder, moveKind, TileKind } from "./tiles";

const LABELS: Record<TileKind, string> = { stream: "Screen", them: "Them", me: "Me" };

const firstAsset = (...names: string[]) => names.map(n => findAssetId(n)).find(id => id !== undefined);

function ArrangeSheet() {
    useSplitViewSettings(s => s.order);
    const rotateOn = useCheeseburger(s => s.rotate);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onRotateChange(force), []);
    const order = currentOrder();

    return (
        <ActionSheet>
            <BottomSheetTitleHeader title="Arrange" />
            <View style={{ paddingVertical: 16 }}>
                <TableRowGroup title="Top to bottom">
                    {order.map((kind, i) => (
                        <TableRow
                            key={kind}
                            label={LABELS[kind]}
                            trailing={
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    <IconButton
                                        size="sm"
                                        variant="secondary"
                                        icon={firstAsset("ArrowSmallUpIcon", "ChevronSmallUpIcon", "ArrowsUpDownIcon")}
                                        disabled={i === 0}
                                        onPress={() => moveKind(kind, -1)}
                                    />
                                    <IconButton
                                        size="sm"
                                        variant="secondary"
                                        icon={firstAsset("ArrowSmallDownIcon", "ChevronSmallDownIcon", "ArrowsUpDownIcon")}
                                        disabled={i === order.length - 1}
                                        onPress={() => moveKind(kind, 1)}
                                    />
                                </View>
                            }
                        />
                    ))}
                </TableRowGroup>
                {rotateOn && (
                    <TableRowGroup title="Screen">
                        <TableRow label={isLandscapeLocked() ? "Portrait" : "Landscape"} onPress={toggleLandscape} />
                    </TableRowGroup>
                )}
            </View>
        </ActionSheet>
    );
}

export function SplitViewButton() {
    const { showButton, iconSize } = useSplitViewSettings();
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onSplitChange(force), []);
    if (!showButton) return null;

    const active = isSplitActive();
    const icon = firstAsset("GridSquareIcon", "GridVerticalIcon", "LayoutIcon", "ArrowsUpDownIcon");
    const d = Number(iconSize) || 26;
    const color = active ? "#5865f2" : "#ffffff";

    return (
        <Pressable
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
