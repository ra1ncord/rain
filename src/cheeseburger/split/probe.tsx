import { React } from "@metro/common";
import { Dimensions, View } from "react-native";

export interface Box { x: number; y: number; width: number; height: number; at: number; viewport: string; }

export const viewportKey = () => {
    const win = Dimensions.get("window");
    return `${Math.round(win.width)}x${Math.round(win.height)}`;
};

const tileRefs = new Map<object, { current: any; }>();
let toolbarRef: { current: any; } | null = null;
let toolbarSeen = false;

export const measured: { parent?: Box & { coords: any; sv: object; }; toolbar?: Box; } = {};

const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 0 } as const;

export function TileProbe({ coords }: { coords: any; }) {
    const ref = React.useRef<any>(null);
    React.useEffect(() => {
        tileRefs.set(coords, ref);
        return () => {
            if (tileRefs.get(coords) === ref) tileRefs.delete(coords);
        };
    }, [coords]);
    return <View ref={ref} collapsable={false} pointerEvents="none" style={FILL} />;
}

export function useToolbarRef() {
    const ref = React.useRef<any>(null);
    React.useEffect(() => {
        toolbarRef = ref;
        toolbarSeen = true;
        return () => {
            if (toolbarRef === ref) {
                toolbarRef = null;
                delete measured.toolbar;
            }
        };
    }, []);
    return ref;
}

export const toolbarKnown = () => toolbarSeen;

function measure(node: any, done: (b: Box) => void) {
    const viewport = viewportKey();
    try {
        node?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
            try {
                if (viewport === viewportKey() && [x, y, width, height].every(n => typeof n === "number" && Number.isFinite(n)) && width > 0 && height > 0) {
                    done({ x, y, width, height, at: Date.now(), viewport });
                }
            } catch { }
        });
    } catch { }
}

export function measureAll(read: (sv: any) => any, prefer?: object) {
    const ref = prefer ? tileRefs.get(prefer) : undefined;
    if (prefer && ref) {
        const value = read(prefer);
        const coords = value && typeof value === "object" ? { ...value } : null;
        measure(ref.current, b => {
            if (tileRefs.get(prefer) !== ref || !coords) return;
            const current = read(prefer);
            if (!current || !["x", "y", "width", "height"].every(k => typeof coords[k] === "number" && Math.abs(coords[k] - current[k]) < 0.5)) return;
            measured.parent = { ...b, coords, sv: prefer };
        });
    } else {
        delete measured.parent;
    }
    measureToolbarNow();
}

export const hasToolbarRef = () => !!toolbarRef?.current;

export function measureToolbarNow() {
    const ref = toolbarRef;
    if (ref?.current) measure(ref.current, b => {
        if (toolbarRef === ref) measured.toolbar = b;
    });
}
