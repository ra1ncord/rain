import { React } from "@metro/common";
import { Dimensions, View } from "react-native";

import { caught, safe } from "../crash";

export interface Box { x: number; y: number; width: number; height: number; at: number; viewport: string; }

export const viewportKey = () => {
    const win = Dimensions.get("window");
    return `${Math.round(win.width)}x${Math.round(win.height)}`;
};

const tileRefs = new Map<object, Set<{ current: any; }>>();
const tileVersions = new WeakMap<object, number>();
let nextTileVersion = 0;
const headerRefs = new Map<string, Set<{ current: any; }>>();
const pendingMeasures = new WeakMap<object, { started: number; }>();
const geometryElements = new WeakSet<object>();
const NATIVE_VIEW = /^(?:View|RCTView|REAWorkaroundView|AnimatedComponent|AnimatedView|AnimatedComponent\(View\)|Animated\(View\))$/;
const probeCounts = { mounted: 0, added: 0, requested: 0, accepted: 0, contained: 0, missing: 0, stale: 0, rejected: 0 };
let probeNote = "not measured yet";
let preferredCoords: object | undefined;
let toolbarRef: { current: any; } | null = null;
let toolbarSeen = false;
let tileGeneration = 0;

export const measured: { parent?: Box & { coords: any; sv: object; }; toolbar?: Box; header?: Box & { label: string; }; } = {};

const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 0 } as const;

function Probe({ coords }: { coords: any; }) {
    const ref = React.useRef<any>(null);
    React.useEffect(() => {
        let refs = tileRefs.get(coords);
        if (!refs) tileRefs.set(coords, refs = new Set());
        refs.add(ref);
        tileVersions.set(coords, ++nextTileVersion);
        probeCounts.mounted++;
        return () => {
            probeCounts.mounted = Math.max(0, probeCounts.mounted - 1);
            refs!.delete(ref);
            tileVersions.set(coords, ++nextTileVersion);
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

export function withTileProbe(ret: any, coords: any): any {
    probeCounts.added++;
    return React.createElement(React.Fragment, { key: ret.key ?? undefined }, ret, <TileProbe key="cheeseburger-probe" coords={coords} />);
}

export const tileProbeVersion = (coords?: object) => coords ? tileVersions.get(coords) ?? 0 : 0;

export function useHeaderRef(label = "change audio output") {
    const ref = React.useRef<any>(null);
    React.useEffect(() => {
        let refs = headerRefs.get(label);
        if (!refs) headerRefs.set(label, refs = new Set());
        refs.add(ref);
        return () => {
            refs!.delete(ref);
            if (headerRefs.get(label) === refs && !refs!.size) headerRefs.delete(label);
        };
    }, [label]);
    return ref;
}

function HeaderProbe({ label }: { label: string; }) {
    const ref = useHeaderRef(label);
    return <View ref={ref} collapsable={false} pointerEvents="none" style={FILL} />;
}

function headerLabels(node: any, found = new Set<string>(), depth = 0): Set<string> {
    if (!node || depth > 7) return found;
    if (Array.isArray(node)) {
        for (const child of node) headerLabels(child, found, depth + 1);
        return found;
    }
    if (typeof node !== "object") return found;
    const label = String(node.props?.accessibilityLabel ?? "").toLowerCase();
    if (/^(?:change audio output|minimize|show chat)$/.test(label)) found.add(label);
    headerLabels(node.props?.children, found, depth + 1);
    return found;
}

export function captureCallGeometry(args: any[], ret: any): any {
    if (!ret || typeof ret !== "object" || geometryElements.has(ret)) return ret;
    const type = args[0];
    const name = typeof type === "string" ? type : type?.displayName ?? type?.name ?? type?.render?.displayName ?? type?.render?.name ?? "";
    if (type !== View && !NATIVE_VIEW.test(name)) return ret;
    if (ret.type !== args[0]) return ret;
    const children = ret.props?.children;
    if (headerLabels(children).size < 2) return ret;
    geometryElements.add(ret);
    const out = React.cloneElement(
        ret,
        undefined,
        ...(Array.isArray(children) ? children : [children]),
        <Guard key="cheeseburger-header-probe"><HeaderProbe label="call header" /></Guard>,
    );
    geometryElements.add(out);
    return out;
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

function measure(ref: { current: any; }, done: (b: Box) => void) {
    const node = ref.current;
    if (typeof node?.measureInWindow !== "function") { probeCounts.missing++; return; }
    const pending = pendingMeasures.get(ref);
    if (pending && Date.now() - pending.started < 500) return;
    const request = { started: Date.now() };
    pendingMeasures.set(ref, request);
    probeCounts.requested++;
    const viewport = viewportKey();
    try {
        node.measureInWindow(safe("split measure", (x: number, y: number, width: number, height: number) => {
            if (pendingMeasures.get(ref) !== request) return;
            pendingMeasures.delete(ref);
            if (ref.current === node && viewport === viewportKey() && [x, y, width, height].every(n => typeof n === "number" && Number.isFinite(n)) && width > 0 && height > 0) {
                done({ x, y, width, height, at: Date.now(), viewport });
            }
        }));
    } catch (e) {
        pendingMeasures.delete(ref);
        caught("split measure", e);
    }
}

export const parentOrigin = (box: Box & { coords: any; }) => ({
    x: box.x - box.coords.x - (box.coords.width - box.width) / 2,
    y: box.y - box.coords.y - (box.coords.height - box.height) / 2,
});

export function resetTileMeasurements() {
    tileGeneration++;
    preferredCoords = undefined;
    delete measured.parent;
}

export function measureAll(read: (sv: any) => any, prefer?: object, aspect?: number) {
    preferredCoords = prefer;
    const generation = tileGeneration;
    const refs = prefer ? tileRefs.get(prefer) : undefined;
    if (prefer && refs?.size) {
        const value = read(prefer);
        const coords = value && typeof value === "object" ? { ...value } : null;
        for (const ref of refs) measure(ref, b => {
            if (generation !== tileGeneration || preferredCoords !== prefer || !tileRefs.get(prefer)?.has(ref) || !coords) { probeCounts.stale++; return; }
            const current = read(prefer);
            if (!current || !["x", "y", "width", "height"].every(k => typeof coords[k] === "number" && Math.abs(coords[k] - current[k]) < 0.5)) { probeCounts.stale++; return; }
            const matches = (w: number, h: number) => Math.abs(b.width - w) <= Math.max(4, w * 0.02) && Math.abs(b.height - h) <= Math.max(4, h * 0.02);
            const full = matches(coords.width, coords.height);
            const containedWidth = aspect && aspect > 0 ? Math.min(coords.width, coords.height * aspect) : 0;
            const containedHeight = containedWidth && aspect ? containedWidth / aspect : 0;
            const contained = !full && !!containedWidth && matches(containedWidth, containedHeight);
            probeNote = `${Math.round(b.width)}x${Math.round(b.height)} in ${Math.round(coords.width)}x${Math.round(coords.height)} ${full ? "full" : contained ? "contained" : "rejected"}`;
            if (!full && !contained) { probeCounts.rejected++; return; }
            probeCounts.accepted++;
            if (contained) probeCounts.contained++;
            measured.parent = { ...b, coords, sv: prefer };
        });
    } else {
        delete measured.parent;
    }
    measureToolbarNow();
}

export const hasToolbarRef = () => !!toolbarRef?.current;

export const probeDebug = () => [`tile probes: ${probeCounts.mounted} mounted, ${probeCounts.added} added, ${tileRefs.size} sources, ${preferredCoords && tileRefs.get(preferredCoords)?.size || 0} selected; requests ${probeCounts.requested}, accepted ${probeCounts.accepted} (${probeCounts.contained} contained), missing ${probeCounts.missing}, stale ${probeCounts.stale}, rejected ${probeCounts.rejected}; ${probeNote}`];

export function measureToolbarNow() {
    const ref = toolbarRef;
    if (ref?.current) measure(ref, b => {
        if (toolbarRef !== ref) return;
        measured.toolbar = b;
    });
    const priority = (label: string) => label === "call header" ? 4 : label === "change audio output" ? 3 : label === "minimize" ? 2 : 1;
    for (const [label, refs] of headerRefs) for (const header of refs) measure(header, b => {
        if (!headerRefs.get(label)?.has(header)) return;
        const win = Dimensions.get("window");
        if (b.y < 0 || b.y > win.height * 0.4 || b.height > win.height * 0.25) return;
        if (label === "call header" && b.width < win.width * 0.6) return;
        const previous = measured.header;
        if (previous?.viewport === b.viewport && Date.now() - previous.at < 500 && priority(previous.label) > priority(label)) return;
        measured.header = { ...b, label };
    });
}
