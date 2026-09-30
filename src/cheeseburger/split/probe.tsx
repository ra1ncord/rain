import { React } from "@metro/common";
import { View } from "react-native";

export interface Box { x: number; y: number; width: number; height: number; at: number; }

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
    try {
        node?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
            try {
                if ([x, y, width, height].every(n => typeof n === "number" && Number.isFinite(n)) && width > 0 && height > 0) {
                    done({ x, y, width, height, at: Date.now() });
                }
            } catch { }
        });
    } catch { }
}

export function measureAll(read: (sv: any) => any, prefer?: object) {
    const ref = prefer ? tileRefs.get(prefer) : undefined;
    if (prefer && ref) {
        const coords = read(prefer);
        measure(ref.current, b => {
            measured.parent = { ...b, coords, sv: prefer };
        });
    } else {
        delete measured.parent;
    }
    if (toolbarRef?.current) measure(toolbarRef.current, b => {
        measured.toolbar = b;
    });
}

export const hasToolbarRef = () => !!toolbarRef?.current;

export function measureToolbarNow() {
    if (toolbarRef?.current) measure(toolbarRef.current, b => {
        measured.toolbar = b;
    });
}
