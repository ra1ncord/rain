import { findAssetId } from "@api/assets";
import { findByProps } from "@metro";
import { React } from "@metro/common";
import { ActionSheet, BottomSheetTitleHeader, IconButton, TableRow, TableRowGroup } from "@metro/common/components";
import { Animated, Text, View } from "react-native";

import { isLandscapeLocked, onRotateChange, toggleLandscape } from "../rotate/orientation";
import { useCheeseburger } from "../storage";
import { useSplitViewSettings } from "./storage";
import { currentOrder, moveKind, moveTo, TileKind } from "./tiles";

export const LABELS: Record<TileKind, string> = { stream: "Screen", them: "Them", me: "Me" };

const firstAsset = (...names: string[]) => names.map(n => findAssetId(n)).find(id => id !== undefined);

let gestures: any;
const gestureModule = () => {
    if (gestures === undefined) {
        try {
            gestures = findByProps("Gesture", "GestureDetector") ?? null;
        } catch {
            gestures = null;
        }
    }
    return gestures;
};

interface Drag { from: number; to: number; }

function DragArea({ index, hold, children, onStart, onMove, onEnd }: {
    index: number;
    hold: boolean;
    children: React.ReactNode;
    onStart: (i: number) => void;
    onMove: (dy: number) => void;
    onEnd: (done: boolean) => void;
}) {
    const gh = gestureModule();
    const cb = React.useRef({ onStart, onMove, onEnd, index });
    cb.current = { onStart, onMove, onEnd, index };
    const gesture = React.useMemo(() => {
        if (!gh) return null;
        let pan = gh.Gesture.Pan();
        pan = hold ? pan.activateAfterLongPress(220) : typeof pan.minDistance === "function" ? pan.minDistance(1) : pan;
        let started = false;
        let ended = false;
        return pan.shouldCancelWhenOutside(false).runOnJS(true)
            .onStart(() => {
                started = true;
                ended = false;
                cb.current.onStart(cb.current.index);
            })
            .onUpdate((e: any) => {
                if (started) cb.current.onMove(e.translationY ?? 0);
            })
            .onEnd((_: any, success: boolean) => {
                if (!started) return;
                ended = true;
                cb.current.onEnd(success !== false);
            })
            .onFinalize(() => {
                if (started && !ended) cb.current.onEnd(false);
                started = ended = false;
            });
    }, [gh, hold]);
    if (!gesture) return <View>{children}</View>;
    const { GestureDetector } = gh;
    return <GestureDetector gesture={gesture}><View collapsable={false}>{children}</View></GestureDetector>;
}

function Handle() {
    const id = firstAsset("DragIcon", "GripIcon", "ReorderIcon", "ic_drag_handle", "ic_drag_indicator", "MenuIcon");
    return (
        <View style={{ paddingVertical: 4, paddingRight: 4 }}>
            {id !== undefined ? <TableRow.Icon source={id} /> : <Text style={{ color: "#c48d96", fontSize: 18 }}>≡</Text>}
        </View>
    );
}

export function ArrangeList() {
    useSplitViewSettings(s => s.order);
    const order = currentOrder();
    const [drag, setDrag] = React.useState<Drag | null>(null);
    const dragRef = React.useRef<Drag | null>(null);
    const rowH = React.useRef(64);
    const dy = React.useRef(new Animated.Value(0)).current;
    const offsets = React.useRef(new Map<TileKind, Animated.Value>()).current;
    const offsetOf = (k: TileKind) => {
        let v = offsets.get(k);
        if (!v) offsets.set(k, v = new Animated.Value(0));
        return v;
    };

    React.useEffect(() => {
        order.forEach((k, i) => {
            const d = drag;
            const to = d && i !== d.from ? (d.from < i && i <= d.to ? -rowH.current : d.to <= i && i < d.from ? rowH.current : 0) : 0;
            Animated.spring(offsetOf(k), { toValue: to, useNativeDriver: false, speed: 28, bounciness: 0 }).start();
        });
    }, [drag]);

    const start = (i: number) => {
        dy.setValue(0);
        dragRef.current = { from: i, to: i };
        setDrag(dragRef.current);
    };
    const move = (y: number) => {
        const d = dragRef.current;
        if (!d) return;
        dy.setValue(y);
        const to = Math.max(0, Math.min(order.length - 1, d.from + Math.round(y / Math.max(1, rowH.current))));
        if (to !== d.to) {
            dragRef.current = { from: d.from, to };
            setDrag(dragRef.current);
        }
    };
    const end = (done: boolean) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (d && done && d.to !== d.from) moveTo(d.from, d.to);
        dy.setValue(0);
        offsets.forEach(v => v.setValue(0));
        setDrag(null);
    };

    const upIcon = firstAsset("ArrowSmallUpIcon", "ChevronSmallUpIcon", "ArrowsUpDownIcon");
    const downIcon = firstAsset("ArrowSmallDownIcon", "ChevronSmallDownIcon", "ArrowsUpDownIcon");

    return (
        <TableRowGroup title="Top to bottom">
            {order.map((kind, i) => {
                const lifted = drag?.from === i;
                return (
                    <Animated.View
                        key={kind}
                        onLayout={(e: any) => {
                            const h = e?.nativeEvent?.layout?.height;
                            if (h > 0) rowH.current = h;
                        }}
                        style={{
                            zIndex: lifted ? 2 : 0,
                            elevation: lifted ? 6 : 0,
                            opacity: lifted ? 0.92 : 1,
                            transform: [{ translateY: lifted ? dy : offsetOf(kind) }],
                        }}
                    >
                        <DragArea index={i} hold onStart={start} onMove={move} onEnd={end}>
                            <TableRow
                                label={LABELS[kind]}
                                icon={<DragArea index={i} hold={false} onStart={start} onMove={move} onEnd={end}><Handle /></DragArea>}
                                trailing={
                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                        <IconButton size="sm" variant="secondary" icon={upIcon} disabled={i === 0} onPress={() => moveKind(kind, -1)} />
                                        <IconButton size="sm" variant="secondary" icon={downIcon} disabled={i === order.length - 1} onPress={() => moveKind(kind, 1)} />
                                    </View>
                                }
                            />
                        </DragArea>
                    </Animated.View>
                );
            })}
        </TableRowGroup>
    );
}

export function ArrangeSheet() {
    const rotateOn = useCheeseburger(s => s.rotate);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onRotateChange(force), []);

    return (
        <ActionSheet>
            <BottomSheetTitleHeader title="Arrange" />
            <View style={{ paddingVertical: 16, gap: 16 }}>
                <ArrangeList />
                {rotateOn && (
                    <TableRowGroup title="Screen">
                        <TableRow label={isLandscapeLocked() ? "Portrait" : "Landscape"} onPress={toggleLandscape} />
                    </TableRowGroup>
                )}
            </View>
        </ActionSheet>
    );
}
