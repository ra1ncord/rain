import { hotStatus } from "@api/hot/status";
import { BundleUpdaterManager, getNativeModule, NativeFileModule } from "@api/native/modules";
import { before } from "@api/patcher";
import { React } from "@metro/common";
import { SelectedChannelStore } from "@metro/common/stores";
import { AppState } from "react-native";

type Kind = "crash" | "error" | "caught" | "closed";

interface Entry { at: number; kind: Kind; what: string; stack?: string; n?: number; revision?: string; context?: string; }
interface Session { started: number; beat: number; state: string; call?: boolean; rev: string; ended?: string; }
interface Saved { log: Entry[]; session?: Session; }

const FILE = "rain/cheeseburger-crash.json";
const MAX = 14;
const g = globalThis as any;

let saved: Saved = { log: [] };
let session: Session | null = null;
let beat: ReturnType<typeof setInterval> | null = null;
let appSub: { remove(): void; } | null = null;
let unreload: (() => unknown) | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let notifyTimer: ReturnType<typeof setTimeout> | null = null;
let revisionTimer: ReturnType<typeof setTimeout> | null = null;
let writing: Promise<void> = Promise.resolve();
let restoring: Promise<void> = Promise.resolve();
let ready = false;
let waiting = false;
let gen = 0;
const listeners = new Set<() => void>();
const recent = new Map<string, number>();

const current = () => g.__cheeseburgerCrashGen === gen;

function describe(e: any): string {
    try {
        if (e && typeof e === "object" && "message" in e) return `${e.name ?? "Error"}: ${String(e.message)}`;
        if (typeof e === "string") return e;
        return JSON.stringify(e) ?? String(e);
    } catch {
        return "unknown error";
    }
}

function shortStack(stack: unknown): string | undefined {
    if (typeof stack !== "string") return undefined;
    const out: string[] = [];
    for (const raw of stack.split("\n").slice(1)) {
        const line = raw.trim().replace(/^at\s+/, "");
        if (!line) continue;
        const m = line.match(/^(.*?)\s*\((?:address at\s+)?(.*)\)$/);
        const name = (m ? m[1] : line).trim() || "?";
        const loc = m?.[2].match(/([^/\\]+?):(\d+):(\d+)$/);
        out.push(loc ? `${name}@${loc[1]}:${loc[2]}:${loc[3]}` : name);
        if (out.length >= 8) break;
    }
    return out.length ? out.join(" < ") : undefined;
}

function notify() {
    if (notifyTimer) return;
    notifyTimer = setTimeout(() => {
        notifyTimer = null;
        listeners.forEach(l => {
            try {
                l();
            } catch { }
        });
    }, 0);
}

function trim() {
    saved.log.sort((a, b) => a.at - b.at);
    for (const kind of ["error", "caught", "closed", "crash"] as Kind[]) {
        while (saved.log.length > MAX) {
            const i = saved.log.findIndex(e => e.kind === kind);
            if (i === -1) break;
            saved.log.splice(i, 1);
        }
    }
}

function add(kind: Kind, what: string, stack?: string, at = Date.now(), revision = hotStatus.revision, context?: string) {
    const i = saved.log.findIndex(x => x.kind === kind && x.what === what && x.revision === revision);
    if (i !== -1) {
        const [hit] = saved.log.splice(i, 1);
        hit.n = (hit.n ?? 1) + 1;
        hit.at = Math.max(hit.at, at);
        if (stack) hit.stack = stack;
        if (context) hit.context = context;
        saved.log.push(hit);
    } else {
        saved.log.push({ at, kind, what, revision, ...(stack ? { stack } : {}), ...(context ? { context } : {}) });
    }
    trim();
    notify();
}

function write(): Promise<void> {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = null;
    if (!current()) return writing;
    if (!ready) {
        waiting = true;
        return writing;
    }
    const data = JSON.stringify({ log: saved.log, session: session ?? saved.session });
    writing = writing
        .then(() => NativeFileModule.writeFile("documents", FILE, data, "utf8"))
        .then(() => { }, () => { });
    return writing;
}

function soon() {
    if (writeTimer) return;
    writeTimer = setTimeout(() => {
        writeTimer = null;
        void write();
    }, 1500);
}

async function load(): Promise<Saved | null> {
    try {
        const path = `${NativeFileModule.getConstants().DocumentsDirPath}/${FILE}`;
        if (!(await NativeFileModule.fileExists(path))) return null;
        const data = JSON.parse(await NativeFileModule.readFile(path, "utf8"));
        return data && Array.isArray(data.log) ? { log: data.log, session: data.session } : null;
    } catch {
        return null;
    }
}

async function androidSaysCrashed(): Promise<boolean | null> {
    try {
        const m: any = getNativeModule("RNSentry");
        if (typeof m?.crashedLastRun !== "function") return null;
        const r = await Promise.race([m.crashedLastRun(), new Promise(res => setTimeout(() => res(null), 1500))]);
        return typeof r === "boolean" ? r : null;
    } catch {
        return null;
    }
}

function inCall() {
    try {
        return !!SelectedChannelStore?.getVoiceChannelId?.();
    } catch {
        return false;
    }
}

export function caught(where: string, e: unknown) {
    try {
        const what = `${where}: ${describe(e)}`.slice(0, 300);
        const now = Date.now();
        const last = recent.get(what);
        if (last !== undefined && now - last < 1000) {
            const hit = saved.log.find(x => x.kind === "caught" && x.what === what && x.revision === hotStatus.revision);
            if (hit) {
                hit.n = (hit.n ?? 1) + 1;
                hit.at = now;
                soon();
                return;
            }
        }
        if (recent.size > 60) recent.clear();
        recent.set(what, now);
        add("caught", what, shortStack((e as any)?.stack), now);
        soon();
    } catch { }
}

export function safe<F extends (...a: any[]) => any>(where: string, fn: F): F {
    return function (this: any, ...args: any[]) {
        try {
            return fn.apply(this, args);
        } catch (e) {
            caught(where, e);
            return undefined;
        }
    } as F;
}

export function safeInstead(where: string, fn: (args: any[], orig: Function) => any) {
    return function (this: any, args: any[], orig: Function) {
        let state = 0;
        let result: any;
        let error: any;
        const call = function (this: any, ...a: any[]) {
            try {
                result = orig.apply(this, a);
                state = 1;
                return result;
            } catch (e) {
                state = 2;
                error = e;
                throw e;
            }
        };
        try {
            return fn.call(this, args, call);
        } catch (e) {
            if (state === 2 && e === error) throw e;
            caught(where, e);
            if (state === 1) return result;
            if (state === 2) throw error;
            return orig.apply(this, args);
        }
    };
}

function install() {
    const eu = g.ErrorUtils;
    if (typeof eu?.getGlobalHandler !== "function" || typeof eu.setGlobalHandler !== "function") return;
    const slot = g.__cheeseburgerCrash;
    const cur = eu.getGlobalHandler();
    const base = slot && cur === slot.handler ? slot.base : cur;
    const handler = (e: any, fatal?: boolean) => {
        let handed = false;
        const hand = () => {
            if (handed) return;
            handed = true;
            base?.(e, fatal);
        };
        try {
            add(fatal ? "crash" : "error", describe(e).slice(0, 400), shortStack(e?.stack));
            if (!fatal) {
                soon();
                hand();
                return;
            }
            if (session) session.ended = "crash";
            setTimeout(hand, 1200);
            restoring.then(() => write()).then(hand, hand);
        } catch {
            hand();
        }
    };
    g.__cheeseburgerCrash = { base, handler };
    eu.setGlobalHandler(handler);
}

function uninstall() {
    const eu = g.ErrorUtils;
    const slot = g.__cheeseburgerCrash;
    if (!eu || !slot) return;
    if (eu.getGlobalHandler?.() === slot.handler) eu.setGlobalHandler(slot.base);
    delete g.__cheeseburgerCrash;
}

function merge(entries: Entry[]) {
    const keys = new Set<string>();
    return entries.filter(e => {
        if (!e || typeof e.at !== "number" || typeof e.what !== "string") return false;
        const k = `${e.at}|${e.kind}|${e.what}|${e.revision ?? ""}`;
        if (keys.has(k)) return false;
        keys.add(k);
        return true;
    });
}

async function restore(checked: boolean) {
    const early = saved.log;
    const prevSaved = await load();
    if (!current()) return;
    saved = { log: merge([...(prevSaved?.log ?? []), ...early]), session: prevSaved?.session };
    trim();
    const prev = prevSaved?.session;
    if (!checked && prev && !prev.ended) {
        const android = await androidSaysCrashed();
        if (!current()) return;
        if (prev.state === "active" || prev.call || android) {
            const where = prev.state === "active" ? "open" : prev.call ? "in a call in the background" : "in the background";
            add("closed", `closed while ${where}, no error caught${android ? " (Android reported a crash)" : ""}`, undefined, prev.beat, prev.rev, `previous session ${when(prev.started)}, app ${prev.state}, call ${prev.call ? "yes" : "no"}, Android crash ${android === null ? "unknown" : android ? "yes" : "no"}, heartbeat ${when(prev.beat)}`);
        }
    }
    ready = true;
    waiting = false;
    notify();
    await write();
}

function begin(checked: boolean) {
    restoring = restore(checked).catch(() => {
        if (!current()) return;
        ready = true;
        if (waiting) void write();
    });
}

function touch(state?: string) {
    if (!session) return;
    if (!g.__cheeseburgerSwapping) session.rev = hotStatus.revision;
    if (state) session.state = state;
    session.beat = Date.now();
    session.call = inCall();
    void write();
}

const recordRevision = safe("crash revision", () => {
    revisionTimer = null;
    if (!current() || !session) return;
    if (g.__cheeseburgerSwapping) {
        revisionTimer = setTimeout(recordRevision, 100);
        return;
    }
    touch();
});

export function startCrashLog() {
    gen = (g.__cheeseburgerCrashGen ?? 0) + 1;
    g.__cheeseburgerCrashGen = gen;
    install();
    const handoff = g.__cheeseburgerCrashState;
    if (handoff) {
        delete g.__cheeseburgerCrashState;
        saved = handoff.saved;
        session = handoff.session;
        ready = !!handoff.ready;
        if (!ready) begin(true);
        revisionTimer = setTimeout(recordRevision, 100);
    } else {
        session = { started: Date.now(), beat: Date.now(), state: AppState.currentState ?? "active", call: inCall(), rev: hotStatus.revision };
        begin(false);
    }
    beat = setInterval(safe("crash beat", () => {
        if (AppState.currentState === "active") touch();
    }), 30_000);
    appSub = AppState.addEventListener("change", safe("crash state", (s: string) => touch(s)));
    try {
        if (typeof BundleUpdaterManager?.reload === "function") {
            unreload = before("reload", BundleUpdaterManager, safe("crash reload", () => {
                if (session) session.ended = "reload";
                void write();
            }));
        }
    } catch {
        unreload = null;
    }
}

export function stopCrashLog() {
    if (revisionTimer) clearTimeout(revisionTimer);
    revisionTimer = null;
    if (beat) clearInterval(beat);
    beat = null;
    appSub?.remove();
    appSub = null;
    try {
        unreload?.();
    } catch { }
    unreload = null;
    if (g.__cheeseburgerSwapping) {
        g.__cheeseburgerCrashState = { saved, session, ready };
        return;
    }
    if (session) session.ended = "stopped";
    const done = write();
    uninstall();
    const snapshot = saved;
    void done.then(() => {
        if (saved === snapshot && !beat) {
            saved = { log: [] };
            session = null;
            ready = false;
        }
    });
}

export function markReload() {
    if (session) session.ended = "reload";
    return write();
}

const two = (n: number) => String(n).padStart(2, "0");

function when(t: number) {
    const d = new Date(t);
    const h = d.getHours();
    return `${d.getMonth() + 1}/${d.getDate()} ${h % 12 || 12}:${two(d.getMinutes())}:${two(d.getSeconds())} ${h < 12 ? "AM" : "PM"}`;
}

const label = (e: Entry) => `${when(e.at)} ${e.kind}${e.n && e.n > 1 ? ` x${e.n}` : ""}: ${e.what}`;

export function crashSummary(): string {
    const last = [...saved.log].reverse().find(e => e.kind !== "error") ?? saved.log[saved.log.length - 1];
    return last ? label(last).slice(0, 90) : "nothing yet";
}

export function useCrashSummary() {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        listeners.add(force);
        return () => void listeners.delete(force);
    }, []);
    return crashSummary();
}

export function crashDebug(): string[] {
    return [
        `crash log, running since ${session ? when(session.started) : "?"}, cheeseburger ${hotStatus.source} ${hotStatus.revision.slice(0, 7)}`,
        ...(saved.log.length
            ? [...saved.log].reverse().flatMap(e => [`  ${label(e)}`, `    revision ${e.revision ?? "not recorded"}${e.context ? `; ${e.context}` : ""}`, ...(e.stack ? [`    ${e.stack}`] : [])])
            : ["  nothing yet"]),
    ];
}

export function lastCrashAt(): number {
    let t = 0;
    for (const e of saved.log) if (e.kind === "crash" || e.kind === "closed") t = Math.max(t, e.at);
    return t;
}
