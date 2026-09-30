import { note, short } from "./trail";

const DISCORD_MAX = 200;
const LAYERS: [RegExp, string, string][] = [
    [/media-engine\/native\/ios\/VoiceEngine\.tsx$/, "default", "engine"],
    [/VoiceEngineModule\.android\.tsx$/, "VoiceEngine", "module"],
    [/NativeMediaEngineModule\.tsx$/, "default", "native"],
];
const PER_USER = /^(?:connectionInstance)?(?:set|update|apply)(?:Local|User|Participant|Remote|RemoteAudio)?(?:Volume|Gain)$/i;

interface Hook { label: string; obj: any; name: string; orig: Function; wrapped: Function; ok: boolean; }
interface Transaction { userId: string; want: number; context: string; connectionId: any; ssrcs: any[]; matches: number; }
interface Sample { want: number; ratio: number; }
interface Capture { want: number; line: string; returned?: string; }

let current: Transaction | null = null;
let hooks: Hook[] = [];
let hooked = new WeakMap<object, Set<string>>();
let seen: Record<string, string> = {};
const samples = new Map<string, Sample[]>();
const learned = new Map<string, number>();
const nativeCalls = new Map<string, Capture[]>();
let lastLocal = "none yet";
let bypassed = 0;
let unmatched = 0;

function findExport(re: RegExp, key: string): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const p = mods[id]?.__filePath;
        if (typeof p === "string" && re.test(p)) return mods[id].isInitialized ? mods[id].publicModule?.exports?.[key] : undefined;
    }
}

function methodNames(obj: any): string[] {
    const names = new Set<string>();
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

const sameId = (a: any, b: any) => a != null && b != null && String(a) === String(b);

function volumeSlot(name: string, a: any[], t: Transaction): number | null {
    if (!PER_USER.test(name)) return null;
    const volumeAt = a.length - 1;
    if (volumeAt < 1 || typeof a[volumeAt] !== "number" || !Number.isFinite(a[volumeAt])) return null;
    const userAt = volumeAt - 1;
    const matchesUser = sameId(a[userAt], t.userId) || t.ssrcs.some(s => sameId(a[userAt], s));
    if (!matchesUser) return null;
    if (a.length === 2 && !/^connectionInstance/i.test(name)) return volumeAt;
    if (a.length === 3 && sameId(a[0], t.connectionId)) return volumeAt;
    return null;
}

function adjust(label: string, name: string, a: any[]): any[] {
    const t = current;
    if (!t) return a;
    const slot = volumeSlot(name, a, t);
    const shown = a.map(short).join(",");
    if (slot == null) {
        note(`${t.context} ${label}.${name}(${shown}) unrecognized per-user arguments`);
        return a;
    }
    t.matches++;
    const key = `${t.context}:${label}.${name}[${slot}]`;
    const value = a[slot];
    if (t.want > 0 && t.want <= DISCORD_MAX && value > 0) {
        const ratio = value / t.want;
        const previous = samples.get(key) ?? [];
        if (previous.some(s => Math.abs(s.want / t.want - 1) > 0.05) && previous.every(s => Math.abs(s.ratio / ratio - 1) < 0.01)) {
            learned.set(key, ratio);
        } else {
            learned.delete(key);
        }
        previous.push({ want: t.want, ratio });
        if (previous.length > 4) previous.shift();
        samples.set(key, previous);
    }
    const ratio = learned.get(key);
    const target = ratio == null ? null : t.want * ratio;
    const out = [...a];
    if (t.want > DISCORD_MAX && target != null && Number.isFinite(target) && value < target * 0.99) {
        out[slot] = target;
        bypassed++;
    }
    const line = `${t.context} ${short(t.userId)} requested=${short(t.want)} ${label}.${name} volume=${short(value)} forwarded=${short(out[slot])}${ratio == null ? " scale unlearned" : ` scale=${short(ratio)}`}`;
    const captures = nativeCalls.get(key) ?? [];
    const capture = captures.find(c => c.want === t.want);
    if (capture) capture.line = line;
    else captures.push({ want: t.want, line });
    if (captures.length > 6) captures.shift();
    nativeCalls.set(key, captures);
    note(line);
    return out;
}

export function hookEngine() {
    for (const [re, key, label] of LAYERS) {
        const obj = findExport(re, key);
        if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
            seen[label] = "missing";
            continue;
        }
        const names = methodNames(obj).filter(n => /volume|gain/i.test(n));
        seen[label] = names.join(",") || "no volume methods";
        let installed = hooked.get(obj);
        if (!installed) hooked.set(obj, installed = new Set());
        for (const name of names) {
            if (installed.has(name) || /input|output|pan|callback/i.test(name)) continue;
            const orig = obj[name];
            const wrapped = function (this: any, ...a: any[]) {
                let args = a;
                try {
                    args = adjust(label, name, a);
                } catch { }
                const result = orig.apply(this, args);
                try {
                    const slot = current ? volumeSlot(name, args, current) : null;
                    if (current && slot != null) {
                        const captures = nativeCalls.get(`${current.context}:${label}.${name}[${slot}]`);
                        const capture = captures?.find(c => c.want === current!.want);
                        if (capture) capture.returned = short(result);
                    }
                } catch { }
                return result;
            };
            try {
                obj[name] = wrapped;
            } catch { }
            const ok = obj[name] === wrapped;
            hooks.push({ label, obj, name, orig, wrapped, ok });
            if (ok) installed.add(name);
        }
    }
}

function remoteSsrcs(conn: any, userId: string): any[] {
    const out: any[] = [];
    for (const name of ["remoteAudioSSRCs", "audioSSRCs", "userAudioSSRCs"]) {
        const values = conn?.[name];
        const ssrc = values instanceof Map ? values.get(userId) : values?.[userId];
        if (typeof ssrc === "number" || typeof ssrc === "string") out.push(ssrc);
    }
    return out;
}

export function traceLocalVolume(conn: any, userId: string, want: number, context: string, call: () => any): any {
    const previous = current;
    const t: Transaction = { userId, want, context, connectionId: conn?.mediaEngineConnectionId, ssrcs: remoteSsrcs(conn, userId), matches: 0 };
    current = t;
    try {
        return call();
    } finally {
        current = previous;
        lastLocal = `${context} ${short(userId)} requested=${short(want)}, matched per-user setters=${t.matches}`;
        if (!t.matches) unmatched++;
    }
}

export function unhookEngine() {
    for (const h of hooks) {
        try {
            if (h.ok && h.obj[h.name] === h.wrapped) h.obj[h.name] = h.orig;
        } catch { }
    }
    hooks = [];
    hooked = new WeakMap();
    seen = {};
    current = null;
    samples.clear();
    learned.clear();
    nativeCalls.clear();
    lastLocal = "none yet";
    unmatched = bypassed = 0;
}

export function engineDebug(): string[] {
    return [
        ...Object.entries(seen).map(([label, names]) => `${label} volume methods: ${names}`),
        `per-user hooks: ${hooks.map(h => `${h.label}.${h.name}${h.ok ? "" : " (blocked)"}`).join(", ") || "none"}`,
        `gain mappings: ${[...learned.entries()].map(([k, r]) => `${k} x${short(r)}`).join(", ") || "none"}, JS cap overrides: ${bypassed}`,
        `last local: ${lastLocal}; unmatched calls: ${unmatched}`,
        ...[...nativeCalls.values()].flatMap(captures => captures.map(c => `${c.line}; setter returned ${c.returned ?? "not captured"}`)),
        "output verification: JS/native-boundary arguments only; speaker output has not been measured",
    ];
}
