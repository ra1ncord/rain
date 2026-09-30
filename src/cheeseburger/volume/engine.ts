import { note, short } from "./trail";

const DISCORD_MAX = 200;
const LAYERS: [RegExp, string, string][] = [
    [/media-engine\/native\/ios\/VoiceEngine\.tsx$/, "default", "engine"],
    [/VoiceEngineModule\.android\.tsx$/, "VoiceEngine", "module"],
    [/NativeMediaEngineModule\.tsx$/, "default", "native"],
];
const GUESSES = ["setLocalVolume", "setOutputVolume", "setInputVolume", "setLocalPan", "setVolume"];

interface Hook { label: string; obj: any; name: string; orig: Function; ok: boolean; }

let pending: { userId: string; want: number; at: number; routes: any[]; } | null = null;
let hooks: Hook[] = [];
let hookedObjs = new WeakSet<object>();
let seen: Record<string, string> = {};
const samples = new Map<string, { want: number; r: number; }[]>();
const learned = new Map<string, number>();
let bypassed = 0;
const nativeCalls = new Map<string, { want: number; args: string; changed: string; count: number; }>();
const teaching = new WeakSet<object>();
export const isTeaching = (conn: object) => teaching.has(conn);

export function expect(userId: string, want: number, conn?: any) {
    const ssrcs = conn?.remoteAudioSSRCs;
    const ssrc = ssrcs instanceof Map ? ssrcs.get(userId) : ssrcs?.[userId];
    const routes = [userId, conn?.mediaEngineConnectionId, ssrc].filter(v => v != null);
    pending = { userId, want, at: Date.now(), routes };
}

function findExport(re: RegExp, key: string): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const p = mods[id]?.__filePath;
        if (typeof p === "string" && re.test(p)) return mods[id].isInitialized ? mods[id].publicModule?.exports?.[key] : undefined;
    }
}

function methodNames(obj: any): string[] {
    const names = new Set<string>(GUESSES);
    try {
        for (let o = obj, d = 0; o && o !== Object.prototype && d < 3; o = Object.getPrototypeOf(o), d++) {
            for (const n of Object.getOwnPropertyNames(o)) names.add(n);
        }
    } catch { }
    return [...names].filter(n => {
        try {
            return n !== "constructor" && typeof obj[n] === "function";
        } catch {
            return false;
        }
    });
}

function adjust(label: string, name: string, a: any[]): any[] {
    const p = pending && Date.now() - pending.at < 50 && pending.routes.some(v => a.includes(v)) ? pending : null;
    const shown = a.map(short).join(",");
    if (!p) {
        note(`${label}.${name}(${shown})`);
        return a;
    }
    const out = [...a];
    let did = "";
    a.forEach((x, i) => {
        if (typeof x !== "number" || x <= 0) return;
        const key = `${label}.${name}.${i}`;
        if (p.want > 1 && p.want <= DISCORD_MAX) {
            const r = x / p.want;
            const prev = samples.get(key) ?? [];
            for (const s of prev) if (Math.abs(s.want / p.want - 1) > 0.05 && Math.abs(s.r / r - 1) < 0.01) learned.set(key, r);
            prev.push({ want: p.want, r });
            if (prev.length > 4) prev.shift();
            samples.set(key, prev);
        } else if (p.want > DISCORD_MAX) {
            const r = learned.get(key);
            if (r === undefined) return;
            const target = p.want * r;
            if (x < target * 0.99) {
                out[i] = target;
                did = ` -> ${short(target)}`;
                bypassed++;
            }
        }
    });
    note(`${label}.${name}(${shown})${did}`);
    const key = `${label}.${name}`;
    nativeCalls.set(key, { want: p.want, args: shown, changed: did, count: (nativeCalls.get(key)?.count ?? 0) + 1 });
    return out;
}

export function hookEngine() {
    for (const [re, key, label] of LAYERS) {
        const obj = findExport(re, key);
        if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
            seen[label] ??= "missing";
            continue;
        }
        const names = methodNames(obj);
        seen[label] = names.join(",");
        if (hookedObjs.has(obj)) continue;
        hookedObjs.add(obj);
        for (const name of names) {
            if (!/^(set|update|apply)/.test(name) || !/volume|gain|pan/i.test(name)) continue;
            const orig = obj[name];
            const w = function (this: any, ...a: any[]) {
                let args = a;
                try {
                    args = adjust(label, name, a);
                } catch { }
                return orig.apply(this, args);
            };
            try {
                obj[name] = w;
            } catch { }
            hooks.push({ label, obj, name, orig, ok: obj[name] === w });
        }
    }
}

const taught = new WeakSet<object>();

export function teach(conn: any, userId: string, restoreVolume: number) {
    if (taught.has(conn) || typeof conn?.setLocalVolume !== "function") return;
    const ssrcs = conn.remoteAudioSSRCs;
    const ssrc = ssrcs instanceof Map ? ssrcs.get(userId) : ssrcs?.[userId];
    if (ssrc == null) return;
    taught.add(conn);
    teaching.add(conn);
    try {
        for (const v of [100, 150]) conn.setLocalVolume(userId, v);
    } catch { }
    finally {
        teaching.delete(conn);
        try { conn.setLocalVolume(userId, restoreVolume); } catch { }
    }
}

export function unhookEngine() {
    for (const h of hooks) {
        try {
            if (h.ok) h.obj[h.name] = h.orig;
        } catch { }
    }
    hooks = [];
    hookedObjs = new WeakSet<object>();
    seen = {};
    pending = null;
    nativeCalls.clear();
}

export function engineDebug(): string[] {
    return [
        ...Object.entries(seen).map(([label, names]) => `${label}: ${names.length > 400 ? `${names.slice(0, 400)}…` : names}`),
        `hooked: ${hooks.map(h => `${h.label}.${h.name}${h.ok ? "" : " (blocked)"}`).join(", ") || "none"}`,
        `learned: ${[...learned.entries()].map(([k, r]) => `${k} x${short(r)}`).join(", ") || "none"}, pushed past cap: ${bypassed}`,
        `output verification: ${nativeCalls.size ? "native arguments captured; speaker gain not measured" : "no matching native volume call captured; boost unverified"}`,
        ...[...nativeCalls].map(([key, call]) => `  ${key}: requested ${call.want}%, args [${call.args}]${call.changed}, ${call.count} calls`),
    ];
}
