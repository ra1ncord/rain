import { React } from "@metro/common";
import { PixelRatio, View } from "react-native";

const notchBase = { position: "absolute", width: 0, height: 0, borderColor: "transparent" } as const;

export function Notches({ size, color }: { size: number; color: string; }) {
    return (
        <>
            <View pointerEvents="none" style={[notchBase, { top: 0, left: 0, borderTopWidth: size, borderRightWidth: size, borderTopColor: color }]} />
            <View pointerEvents="none" style={[notchBase, { bottom: 0, right: 0, borderBottomWidth: size, borderLeftWidth: size, borderBottomColor: color }]} />
        </>
    );
}

const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 } as const;

const px = (n: number) => {
    try {
        return PixelRatio.roundToNearestPixel(n);
    } catch {
        return Math.round(n);
    }
};

export function Cut({ size, color, radius = 0 }: { size: number; color: string; radius?: number; }) {
    const [box, setBox] = React.useState<{ w: number; h: number; } | null>(null);
    const limit = box ? Math.min(box.w, box.h) / 3.2 : size;
    const s = px(Math.max(3, Math.min(size, limit)));
    const r = Math.max(0, Math.min(radius, s));
    return (
        <View
            pointerEvents="none"
            style={FILL}
            onLayout={e => {
                const { width, height } = e?.nativeEvent?.layout ?? {};
                if (typeof width !== "number" || typeof height !== "number") return;
                if (!box || Math.abs(box.w - width) > 0.5 || Math.abs(box.h - height) > 0.5) setBox({ w: width, h: height });
            }}
        >
            <View style={{ position: "absolute", left: 0, right: 0, top: s, bottom: s, backgroundColor: color }} />
            <View style={{ position: "absolute", left: s, right: 0, top: 0, height: s, backgroundColor: color, borderTopRightRadius: r }} />
            <View style={{ position: "absolute", left: 0, right: s, bottom: 0, height: s, backgroundColor: color, borderBottomLeftRadius: r }} />
            <View style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, borderColor: "transparent", borderLeftWidth: s, borderBottomWidth: s, borderBottomColor: color }} />
            <View style={{ position: "absolute", right: 0, bottom: 0, width: 0, height: 0, borderColor: "transparent", borderRightWidth: s, borderTopWidth: s, borderTopColor: color }} />
        </View>
    );
}
