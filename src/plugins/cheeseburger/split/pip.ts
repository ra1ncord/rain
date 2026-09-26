import { instead } from "@api/patcher";

import { knownMainAspect, onAspectChange, streamAspect } from "./tiles";

const PIP_PATH = "modules/external_pip/ExternalPip.android.tsx";

const unpatches: (() => unknown)[] = [];
let pip: any = null;
let lastArgs: any[] | null = null;
let lastSent = "";
let selected: string | null = null;
let focused: string | null = null;
let retry: ReturnType<typeof setTimeout> | null = null;

const idOf = (v: any) => (v == null ? null : String(v));

function moduleExports(path: string): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (m?.__filePath === path) return m.isInitialized ? m.publicModule?.exports : undefined;
    }
}

function pipAspect(): number | null {
    const sid = focused ?? selected;
    return (sid && streamAspect(sid)) || knownMainAspect();
}

function shape(args: any[], a: number): any[] | null {
    const [x, y] = args;
    if (typeof x === "number" && typeof y === "number") return [Math.round(a * 1000), 1000, ...args.slice(2)];
    if (typeof x === "number") return [a, ...args.slice(1)];
    if (x && typeof x === "object") {
        if (typeof x.width === "number" && typeof x.height === "number") return [{ ...x, width: Math.round(a * 1000), height: 1000 }, ...args.slice(1)];
        if (typeof x.numerator === "number" && typeof x.denominator === "number") return [{ ...x, numerator: Math.round(a * 1000), denominator: 1000 }, ...args.slice(1)];
        const k = Object.keys(x).find(key => /aspect|ratio/i.test(key) && typeof x[key] === "number");
        if (k) return [{ ...x, [k]: a }, ...args.slice(1)];
    }
    return null;
}

function resend() {
    if (pip && lastArgs) {
        try {
            pip.setPipAspectRatio(...lastArgs);
        } catch { }
    }
}

function patch(tries = 0) {
    retry = null;
    const obj = moduleExports(PIP_PATH)?.default;
    if (!obj || typeof obj.setPipAspectRatio !== "function") {
        if (tries < 60) retry = setTimeout(() => patch(tries + 1), 2000);
        return;
    }
    pip = obj;
    unpatches.push(instead("setPipAspectRatio", pip, (args: any[], orig: Function) => {
        lastArgs = [...args];
        const a = pipAspect();
        const next = a ? shape(args, a) : null;
        lastSent = `${JSON.stringify(args)} -> ${next ? JSON.stringify(next) : "kept"}`;
        return orig(...(next ?? args));
    }));
    for (const [name, set] of [["setSelectedStream", (v: string | null) => selected = v], ["setFocusedStream", (v: string | null) => focused = v]] as const) {
        if (typeof pip[name] !== "function") continue;
        unpatches.push(instead(name, pip, (args: any[], orig: Function) => {
            const before = pipAspect();
            set(idOf(args[0]));
            const ret = orig(...args);
            if (pipAspect() !== before) resend();
            return ret;
        }));
    }
}

export function startPip() {
    patch();
    unpatches.push(onAspectChange(() => setTimeout(resend, 0)));
}

export function stopPip() {
    if (retry) clearTimeout(retry);
    retry = null;
    for (const u of unpatches.splice(0)) u();
    resend();
    pip = null;
    lastArgs = null;
    selected = focused = null;
}

export function pipDebug(): string[] {
    const a = pipAspect();
    return [
        `pip: ${pip ? "hooked" : "not loaded yet"}, stream ${focused ?? selected ?? "main"}, shape ${a ? a.toFixed(3) : "unknown"}`,
        `pip last: ${lastSent || "none yet"}`,
    ];
}
