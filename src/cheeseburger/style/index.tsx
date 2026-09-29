import { before, instead } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";
import { StyleSheet, View } from "react-native";

import { baseColor } from "./colors";
import { styleSettings, useStyleSettings } from "./storage";

const unpatches: (() => unknown)[] = [];
const scoped = new Set<string>();
const failed: string[] = [];
let depth = 0;
let callsFound = false;
let lastScan = 0;
let scanTimer: ReturnType<typeof setTimeout> | null = null;
let bevelled = 0;

const SKIP = /Text|Image|Icon|Svg|Lottie|Avatar|Spinner|Badge/i;

const nameOf = (t: any): string => t?.displayName ?? t?.name ?? t?.render?.displayName ?? t?.render?.name ?? t?.type?.displayName ?? t?.type?.name ?? "";

const num = (v: any) => (typeof v === "number" ? v : 0);

function clear(c: any) {
    if (typeof c === "number") return c >>> 24 === 0;
    if (typeof c !== "string") return true;
    if (c === "transparent") return true;
    if (/^#[0-9a-f]{8}$/i.test(c)) return c.slice(7).toLowerCase() === "00";
    const m = c.match(/rgba?\(([^)]+)\)/i);
    return !!m && m[1].split(",").length === 4 && parseFloat(m[1].split(",")[3]) === 0;
}

function boxStyle(type: any, props: any): any {
    if (typeof type === "string" || !type || SKIP.test(nameOf(type))) return null;
    let style = props.style;
    if (typeof style === "function") {
        try {
            style = style({ pressed: false, hovered: false, focused: false });
        } catch {
            return null;
        }
    }
    let flat: any;
    try {
        flat = StyleSheet.flatten(style);
    } catch {
        return null;
    }
    if (!flat || clear(flat.backgroundColor)) return null;
    const r = Math.max(num(flat.borderRadius), num(flat.borderTopLeftRadius), num(flat.borderBottomRightRadius));
    if (r < 4 || r >= 999) return null;
    const { width: w, height: h } = flat;
    if (typeof w === "number" && typeof h === "number" && r >= Math.min(w, h) / 2 - 0.5) return null;
    return flat;
}

const notchBase = { position: "absolute", width: 0, height: 0, borderColor: "transparent" } as const;

export function Notches({ size, color }: { size: number; color: string; }) {
    return (
        <>
            <View pointerEvents="none" style={[notchBase, { top: 0, left: 0, borderTopWidth: size, borderRightWidth: size, borderTopColor: color }]} />
            <View pointerEvents="none" style={[notchBase, { bottom: 0, right: 0, borderBottomWidth: size, borderLeftWidth: size, borderBottomColor: color }]} />
        </>
    );
}

const SQUARE = { borderTopLeftRadius: 0, borderBottomRightRadius: 0, borderTopRightRadius: 4, borderBottomLeftRadius: 4 };

function bevel(props: any, size: number, color: string) {
    const notches = <Notches key="cheeseburger-bevel" size={size} color={color} />;
    const ch = props.children;
    const children = typeof ch === "function"
        ? (s: any) => [<React.Fragment key="c">{ch(s)}</React.Fragment>, notches]
        : [<React.Fragment key="c">{ch}</React.Fragment>, notches];
    if (!styleSettings.squareCorners) return { ...props, children };
    const st = props.style;
    const style = typeof st === "function" ? (s: any) => [st(s), SQUARE] : [st, SQUARE];
    return { ...props, style, children };
}

function onJsx(args: any[]) {
    const type = args[0];
    if (!callsFound && typeof type === "function" && type.name === "VideoButton") scheduleScan();
    if (depth <= 0) return;
    const props = args[1];
    if (!props || typeof props !== "object") return;
    const flat = boxStyle(type, props);
    if (!flat) return;
    const color = baseColor();
    if (!color) return;
    const r = Math.max(num(flat.borderRadius), num(flat.borderTopLeftRadius));
    const size = Math.max(4, styleSettings.squareCorners ? num(styleSettings.bevelSize) || 8 : Math.max(num(styleSettings.bevelSize) || 8, Math.min(r, 18)));
    bevelled++;
    args[1] = bevel(props, size, color);
    return args;
}

function scope(exp: any, key: string, label: string) {
    if (scoped.has(label)) return;
    scoped.add(label);
    try {
        unpatches.push(instead(key, exp, function (this: any, args: any[], orig: Function) {
            depth++;
            try {
                return orig.apply(this, args);
            } finally {
                depth--;
            }
        }));
    } catch {
        failed.push(label);
    }
}

function eachModule(fn: (path: string, exp: any) => void) {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (!m?.isInitialized) continue;
        const exp = m.publicModule?.exports;
        if (exp && (typeof exp === "object" || typeof exp === "function")) fn(String(m.__filePath ?? id), exp);
    }
}

const isButton = (v: any) => typeof v === "function" && /Button$/.test(v.name ?? "");

function scan() {
    lastScan = Date.now();
    let videoPath: string | null = null;
    eachModule((path, exp) => {
        const keys = Object.keys(exp);
        if (keys.length === 1 && (keys[0] === "Button" || keys[0] === "IconButton") && typeof exp[keys[0]] === "function") {
            scope(exp, keys[0], `${path}#${keys[0]}`);
        }
        if (exp.default?.name === "VideoButton" || typeof exp.VideoButton === "function") videoPath = path;
    });
    if (!videoPath) return;
    callsFound = true;
    const dir = (videoPath as string).slice(0, (videoPath as string).lastIndexOf("/") + 1);
    const parent = dir.slice(0, dir.slice(0, -1).lastIndexOf("/") + 1) || dir;
    eachModule((path, exp) => {
        if (!path.startsWith(parent)) return;
        for (const key of Object.keys(exp)) {
            let v: any;
            try {
                v = exp[key];
            } catch {
                continue;
            }
            if (isButton(v)) scope(exp, key, `${path}#${key}`);
        }
    });
}

function scheduleScan() {
    if (scanTimer || Date.now() - lastScan < 3000) return;
    scanTimer = setTimeout(() => {
        scanTimer = null;
        scan();
    }, 0);
}

export function styleDebug(): string[] {
    return [
        `bevel color: ${baseColor() ?? "none (no theme)"}, size ${styleSettings.bevelSize}, square ${styleSettings.squareCorners}`,
        `button types: ${scoped.size}${failed.length ? `, failed ${failed.length}` : ""}, call buttons ${callsFound ? "found" : "not yet"}, bevelled ${bevelled}`,
        ...[...scoped].slice(0, 30).map(s => `  ${s.replace(/^.*\/(?=[^/]+#)/, "")}`),
    ];
}

export default {
    async start() {
        await waitForHydration(useStyleSettings);
        unpatches.push(before("jsx", jsxRuntime, onJsx));
        unpatches.push(before("jsxs", jsxRuntime, onJsx));
        scan();
    },
    stop() {
        for (const u of unpatches.splice(0)) u();
        scoped.clear();
        failed.length = 0;
        callsFound = false;
        depth = 0;
        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = null;
    },
};
