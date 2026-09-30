import { React } from "@metro/common";
import { Dimensions, View } from "react-native";

import { caught } from "../crash";

export interface Box { x: number; y: number; width: number; height: number; at: number; viewport: string; }

export const viewportKey = () => {
    const win = Dimensions.get("window");
    return `${Math.round(win.width)}x${Math.round(win.height)}`;
};

const tileRefs = new Map<object, Set<{ current: any; }>>();
let measureRound = 0;
let toolbarRef: { current: any; } | null = null;
let toolbarSeen = false;

export const measured: { parent?: Box & { coords: any; sv: object; }; toolbar?: Box; } = {};

const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 0 } as const;

function Probe({ coords }: { coords: any; }) {
    const ref = React.useRef<any>(null);
    React.useEffect(() => {
        let refs = tileRefs.get(coords);
        if (!refs) tileRefs.set(coords, refs = new Set());
        refs.add(ref);
        return () => {
            refs!.delete(ref);
            if (tileRefs.get(coords) === refs && !refs!.size) tileRefs.delete(coords);
        };
    }, [coords]);
    return <View ref={ref} collapsable={false} pointerEvents="none" style={FILL} />;
}

class Guard extends React.Component<{ children?: any; }, { failed: boolean; }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(e: any) { caught("split probe", e); }
    render() { return this.state.failed ? null : this.props.children; }
}

export function TileProbe(props: { coords: any; }) { return <Guard><Probe {...props} /></Guard>; }

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
    const round = ++measureRound;
    const refs = prefer ? tileRefs.get(prefer) : undefined;
    if (prefer && refs?.size) {
        const value = read(prefer);
        const coords = value && typeof value === "object" ? { ...value } : null;
        let best = Infinity;
        for (const ref of refs) measure(ref.current, b => {
            if (round !== measureRound || !tileRefs.get(prefer)?.has(ref) || !coords) return;
            const current = read(prefer);
            if (!current || !["x", "y", "width", "height"].every(k => typeof coords[k] === "number" && Math.abs(coords[k] - current[k]) < 0.5)) return;
            const score = Math.abs(b.width - coords.width) + Math.abs(b.height - coords.height);
            if (score > best) return;
            best = score;
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
