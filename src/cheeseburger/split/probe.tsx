import { React } from "@metro/common";
import { Dimensions, View } from "react-native";

import { caught, safe } from "../crash";

export interface Box { x: number; y: number; width: number; height: number; at: number; viewport: string; }

export const viewportKey = () => {
    const win = Dimensions.get("window");
    return `${Math.round(win.width)}x${Math.round(win.height)}`;
};

const tileRefs = new Map<object, Set<{ current: any; }>>();
const probed = new WeakSet<object>();
const pending = new WeakMap<object, { at: number; }>();
const lastMeasured = new WeakMap<object, number>();
const counts = { requested: 0, accepted: 0, stale: 0, rejected: 0 };
let toolbarRef: { current: any; } | null = null;
let toolbarSeen = false;
let generation = 0;

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
            if (!refs!.size && tileRefs.get(coords) === refs) tileRefs.delete(coords);
            if (measured.parent?.sv === coords) delete measured.parent;
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

export function withTileProbe(ret: any, coords: any): any {
    if (probed.has(ret)) return ret;
    const out = React.createElement(React.Fragment, { key: ret.key ?? undefined }, ret, <TileProbe key="cheeseburger-probe" coords={coords} />);
    probed.add(out);
    return out;
}

export const hasTileProbe = (coords: object) => !!tileRefs.get(coords)?.size;

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

function measure(ref: { current: any; }, done: (b: Box) => void) {
    const node = ref.current;
    if (typeof node?.measureInWindow !== "function") return;
    const now = Date.now();
    if (now - (lastMeasured.get(ref) ?? 0) < 200) return;
    const previous = pending.get(ref);
    if (previous && now - previous.at < 600) return;
    const request = { at: now };
    const version = generation;
    const viewport = viewportKey();
    pending.set(ref, request);
    lastMeasured.set(ref, now);
    counts.requested++;
    try {
        node.measureInWindow(safe("split measure", (x: number, y: number, width: number, height: number) => {
            if (pending.get(ref) !== request) return;
            pending.delete(ref);
            if (version !== generation || ref.current !== node || viewport !== viewportKey() || Date.now() - request.at > 600) {
                counts.stale++;
                return;
            }
            if ([x, y, width, height].every(n => typeof n === "number" && Number.isFinite(n)) && width > 0 && height > 0) {
                done({ x, y, width, height, at: Date.now(), viewport });
            }
        }));
    } catch (e) {
        pending.delete(ref);
        caught("split measure", e);
    }
}

export function resetTileMeasurements() {
    generation++;
    delete measured.parent;
}

export function measureAll(read: (sv: any) => any, prefer?: object, aspect?: number) {
    const refs = prefer ? tileRefs.get(prefer) : undefined;
    if (prefer && refs?.size) {
        const value = read(prefer);
        const coords = value && typeof value === "object" ? { ...value } : null;
        for (const ref of refs) measure(ref, b => {
            const current = read(prefer);
            if (!coords || !tileRefs.get(prefer)?.has(ref) || !current || !["x", "y", "width", "height"].every(k => typeof coords[k] === "number" && Math.abs(coords[k] - current[k]) < 0.5)) {
                counts.stale++;
                return;
            }
            const matches = (w: number, h: number) => Math.abs(b.width - w) <= Math.max(3, w * 0.015) && Math.abs(b.height - h) <= Math.max(3, h * 0.015);
            const containedWidth = aspect && aspect > 0 ? Math.min(coords.width, coords.height * aspect) : 0;
            if (!matches(coords.width, coords.height) && !(containedWidth && aspect && matches(containedWidth, containedWidth / aspect))) {
                counts.rejected++;
                return;
            }
            counts.accepted++;
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
    if (ref?.current) measure(ref, b => {
        if (toolbarRef === ref) measured.toolbar = b;
    });
}

export const probeDebug = () => `probes: ${tileRefs.size} sources, requests ${counts.requested}, accepted ${counts.accepted}, stale ${counts.stale}, rejected ${counts.rejected}`;
