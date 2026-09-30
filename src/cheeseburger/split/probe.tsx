import { React } from "@metro/common";
import { Dimensions, View } from "react-native";

import { caught, safe } from "../crash";

export interface Box { x: number; y: number; width: number; height: number; at: number; viewport: string; }

export const viewportKey = () => {
    const win = Dimensions.get("window");
    return `${Math.round(win.width)}x${Math.round(win.height)}`;
};

const tileRefs = new Map<object, Set<{ current: any; }>>();
const headerRefs = new Map<string, Set<{ current: any; }>>();
const pendingMeasures = new WeakMap<object, { started: number; }>();
const geometryElements = new WeakSet<object>();
let preferredCoords: object | undefined;
let toolbarRef: { current: any; } | null = null;
let toolbarSeen = false;

export const measured: { parent?: Box & { coords: any; sv: object; }; toolbar?: Box; header?: Box & { label: string; }; } = {};

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
    if (args[0] !== View && args[0] !== "RCTView") return ret;
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
    if (typeof node?.measureInWindow !== "function") return;
    const pending = pendingMeasures.get(ref);
    if (pending && Date.now() - pending.started < 500) return;
    const request = { started: Date.now() };
    pendingMeasures.set(ref, request);
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

function changed(a: Box | undefined, b: Box) {
    return !a || a.viewport !== b.viewport || ["x", "y", "width", "height"].some(k => Math.abs((a as any)[k] - (b as any)[k]) >= 0.5);
}

export function measureAll(read: (sv: any) => any, prefer?: object, onMeasured?: () => void) {
    preferredCoords = prefer;
    const refs = prefer ? tileRefs.get(prefer) : undefined;
    if (prefer && refs?.size) {
        const value = read(prefer);
        const coords = value && typeof value === "object" ? { ...value } : null;
        for (const ref of refs) measure(ref, b => {
            if (preferredCoords !== prefer || !tileRefs.get(prefer)?.has(ref) || !coords) return;
            const current = read(prefer);
            if (!current || !["x", "y", "width", "height"].every(k => typeof coords[k] === "number" && Math.abs(coords[k] - current[k]) < 0.5)) return;
            if (Math.abs(b.width - coords.width) > Math.max(4, coords.width * 0.02) || Math.abs(b.height - coords.height) > Math.max(4, coords.height * 0.02)) return;
            const previous = measured.parent;
            measured.parent = { ...b, coords, sv: prefer };
            const o = parentOrigin(measured.parent);
            const before = previous && parentOrigin(previous);
            if (!before || previous!.viewport !== b.viewport || Math.abs(o.x - before.x) >= 0.5 || Math.abs(o.y - before.y) >= 0.5) onMeasured?.();
        });
    } else {
        delete measured.parent;
    }
    measureToolbarNow(onMeasured);
}

export const hasToolbarRef = () => !!toolbarRef?.current;

export function measureToolbarNow(onMeasured?: () => void) {
    const ref = toolbarRef;
    if (ref?.current) measure(ref, b => {
        if (toolbarRef !== ref) return;
        const notify = changed(measured.toolbar, b);
        measured.toolbar = b;
        if (notify) onMeasured?.();
    });
    const priority = (label: string) => label === "call header" ? 4 : label === "change audio output" ? 3 : label === "minimize" ? 2 : 1;
    for (const [label, refs] of headerRefs) for (const header of refs) measure(header, b => {
        if (!headerRefs.get(label)?.has(header)) return;
        const win = Dimensions.get("window");
        if (b.y < 0 || b.y > win.height * 0.4 || b.height > win.height * 0.25) return;
        if (label === "call header" && b.width < win.width * 0.6) return;
        const previous = measured.header;
        if (previous?.viewport === b.viewport && Date.now() - previous.at < 500 && priority(previous.label) > priority(label)) return;
        const notify = changed(previous, b);
        measured.header = { ...b, label };
        if (notify) onMeasured?.();
    });
}
