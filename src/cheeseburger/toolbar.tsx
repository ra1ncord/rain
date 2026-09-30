import { findAssetId } from "@api/assets";
import { before } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { findByName, findByProps } from "@metro";
import { React } from "@metro/common";
import { Image } from "react-native";

import { caught, safe } from "./crash";

export interface Override { icon: string[]; label: string; onPress: () => void; onLongPress?: () => void; color?: string; text?: string; asset?: number; }

const TEMPLATE = /\/VoicePanelSoundboardButton\.tsx$/;
const overrides: Override[] = [];
const icons = new Map<string, any>();
const misses = new Map<string, number>();
const ready = new Set<() => void>();
let users = 0;
let unpatches: (() => unknown)[] = [];
let template: any = null;
let templateProps: any = null;
let lastLook = 0;
let swapped = 0;
let failures = 0;
let lastError = "";

function byPath(re: RegExp): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        const p = m?.__filePath;
        if (typeof p === "string" && re.test(p)) return m.isInitialized ? m.publicModule?.exports : undefined;
    }
}

export function iconComponent(name: string): any {
    if (icons.has(name)) return icons.get(name);
    if (Date.now() - (misses.get(name) ?? 0) < 3000) return null;
    let c: any = null;
    try {
        c = findByProps(name)?.[name] ?? findByName(name) ?? null;
    } catch {
        c = null;
    }
    if (typeof c !== "function" && !(c && typeof c === "object" && c.$$typeof)) c = null;
    if (c) icons.set(name, c);
    else misses.set(name, Date.now());
    return c;
}

const firstIcon = (names: string[]) => {
    for (const n of names) {
        const c = iconComponent(n);
        if (c) return c;
    }
    return null;
};

function lookForTemplate() {
    if (template || Date.now() - lastLook < 2000) return;
    lastLook = Date.now();
    template = byPath(TEMPLATE) ?? null;
}

function onJsx(args: any[]) {
    const type = args[0];
    const props = args[1];
    if (!props || typeof props !== "object") return;
    const ov = overrides[overrides.length - 1];
    if (ov) {
        let next: any = null;
        if (typeof props.onPress === "function") {
            next = { ...props, onPress: ov.onPress, onLongPress: ov.onLongPress, accessibilityLabel: ov.label };
        }
        if (ov.text != null) {
            if (typeof props.label === "string") next = { ...(next ?? props), label: ov.text };
            if (typeof props.children === "string") next = { ...(next ?? props), children: ov.text };
            if (typeof props.accessibilityLabel === "string") next = { ...(next ?? props), accessibilityLabel: ov.label };
        }
        const name = typeof type === "function" || (type && typeof type === "object") ? type.displayName ?? type.name ?? "" : "";
        if (ov.asset != null && typeof props.source === "number") {
            next = { ...(next ?? props), source: ov.asset };
        } else if (/Icon$/.test(name)) {
            const comp = firstIcon(ov.icon);
            if (comp) {
                args[0] = comp;
                swapped++;
            }
            next = { ...(next ?? props), ...(ov.color ? { color: ov.color } : {}) };
        }
        if (next) args[1] = next;
        return next || args[0] !== type ? args : undefined;
    }
    if (typeof type === "function" && type.name === "VideoButton") lookForTemplate();
    if (template && type === template.default) {
        const first = !templateProps;
        templateProps = props;
        if (first) setTimeout(() => ready.forEach(l => l()), 0);
    }
}

class Guard extends React.Component<{ children?: any; fallback?: any; }, { failed: boolean; }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(e: any) {
        failures++;
        lastError = String(e?.message ?? e).slice(0, 120);
        caught("toolbar button", e);
    }

    render() {
        return this.state.failed ? this.props.fallback ?? null : this.props.children;
    }
}

function Clone({ ov, fallback }: { ov: Override; fallback: any; }) {
    const T = React.useRef(template?.default).current;
    const props = React.useRef<any>(templateProps);
    if (templateProps) props.current = templateProps;
    const ok = React.useRef(typeof T === "function" && !!props.current && !!firstIcon(ov.icon)).current;
    if (!ok) return fallback;
    const icon = firstIcon(ov.icon);
    overrides.push(ov);
    let out: any;
    try {
        out = T(props.current);
    } finally {
        overrides.pop();
    }
    return icon ? out ?? fallback : fallback;
}

export function withOverride<T>(ov: Override, fn: () => T): T {
    overrides.push(ov);
    try {
        return fn();
    } finally {
        overrides.pop();
    }
}

export function ToolbarButton(props: Override & { fallback: any; }) {
    const { fallback, ...ov } = props;
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        ready.add(force);
        return () => void ready.delete(force);
    }, []);
    const key = typeof template?.default === "function" && templateProps && firstIcon(ov.icon) ? "clone" : "plain";
    return <Guard key={key} fallback={fallback}><Clone ov={ov} fallback={fallback} /></Guard>;
}

export function iconAsset(...names: string[]) {
    return names.map(n => findAssetId(n)).find(id => id !== undefined);
}

export function PlainIcon({ source, size, color }: { source: any; size: number; color: string; }) {
    return <Image source={source} style={{ width: size, height: size, tintColor: color }} />;
}

export function useToolbar() {
    users++;
    if (users === 1) {
        const hook = safe("toolbar jsx", onJsx);
        unpatches = [before("jsx", jsxRuntime, hook), before("jsxs", jsxRuntime, hook)];
        lastLook = 0;
        lookForTemplate();
    }
    return () => {
        users = Math.max(0, users - 1);
        if (users === 0) {
            for (const u of unpatches.splice(0)) u();
            template = null;
            templateProps = null;
        }
    };
}

export function toolbarDebug(): string {
    const missing = [...misses.keys()].filter(k => !icons.has(k));
    return `toolbar clones: template ${template ? (templateProps ? "ready" : "found") : "not yet"}, icons ${[...icons.keys()].join(", ") || "none"}${missing.length ? `, missing ${missing.join(", ")}` : ""}, swapped ${swapped}${failures ? `, failed ${failures} (${lastError})` : ""}`;
}
