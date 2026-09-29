import { before, instead } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { React } from "@metro/common";

import { caught, safe, safeInstead } from "../crash";

const ROWS = /\/VoicePanelVoiceControlsButtons\.tsx$/;
const TOOLBAR = /\/VoicePanelScreenshareButton\.tsx$/;
const KEY = "cheeseburger-share";

const unpatches: (() => unknown)[] = [];
const listeners = new Set<() => void>();
let rows: any = null;
let bar: any = null;
let barPatched = false;
let lastLook = 0;
let live = 0;
let placed = 0;
let failures = 0;
let lastError = "";
let notifyTimer: ReturnType<typeof setTimeout> | null = null;

function byPath(re: RegExp): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        const p = m?.__filePath;
        if (typeof p === "string" && re.test(p)) return m.isInitialized ? m.publicModule?.exports : undefined;
    }
}

function changed() {
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

class Guard extends React.Component<{ children?: any; }, { failed: boolean; }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(e: any) {
        failures++;
        lastError = String(e?.message ?? e).slice(0, 120);
        caught("share row", e);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

function ShareRow(props: any) {
    const Row = React.useRef(rows?.ScreenshareButton).current;
    const out = typeof Row === "function" ? Row(props) : null;
    const ok = out != null;
    React.useEffect(() => {
        if (!ok) return;
        live++;
        changed();
        return () => {
            live = Math.max(0, live - 1);
            changed();
        };
    }, [ok]);
    return out;
}

function ToolbarShare({ children }: { children?: any; }) {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        listeners.add(force);
        return () => void listeners.delete(force);
    }, []);
    return live > 0 ? null : children ?? null;
}

function dataProps(props: any) {
    const out: any = {};
    for (const k of Object.keys(props ?? {})) {
        if (k === "children" || typeof props[k] === "function") continue;
        out[k] = props[k];
    }
    return out;
}

function ensure() {
    const now = Date.now();
    if ((rows && barPatched) || now - lastLook < 2000) return;
    lastLook = now;
    rows ??= byPath(ROWS) ?? null;
    if (!barPatched) {
        bar ??= byPath(TOOLBAR) ?? null;
        if (bar && typeof bar.default === "function") {
            try {
                unpatches.push(instead("default", bar, safeInstead("share toolbar", (args: any[], orig: Function) => {
                    const out = orig(...args);
                    return out == null ? out : <ToolbarShare>{out}</ToolbarShare>;
                })));
                barPatched = true;
            } catch (e) {
                caught("share toolbar", e);
            }
        }
    }
}

function onJsx(args: any[]) {
    if (!barPatched && typeof args[0] === "function" && args[0].name === "VideoButton") ensure();
    const props = args[1];
    const ch = props?.children;
    if (!rows || !Array.isArray(ch) || ch.length < 2 || ch.length > 40) return;
    const chat = rows.ChatButton;
    const acts = rows.ActivitiesButton;
    if (typeof rows.ScreenshareButton !== "function" || (!chat && !acts)) return;
    let at = -1;
    for (let i = 0; i < ch.length; i++) {
        const c = ch[i];
        if (!c || typeof c !== "object") continue;
        if (c.key === KEY) return;
        if (chat && c.type === chat) {
            at = i;
            break;
        }
        if (acts && c.type === acts && at === -1) at = i;
    }
    if (at === -1) return;
    placed++;
    const row = <Guard key={KEY}><ShareRow {...dataProps(ch[at].props)} /></Guard>;
    args[1] = { ...props, children: [...ch.slice(0, at + 1), row, ...ch.slice(at + 1)] };
    return args;
}

export function shareDebug(): string[] {
    return [
        `share: menu ${rows ? "found" : "not yet"}, toolbar ${barPatched ? "hooked" : "not yet"}, placed ${placed}, showing ${live}${failures ? `, failed ${failures} (${lastError})` : ""}`,
    ];
}

export default {
    start() {
        lastLook = 0;
        ensure();
        const hook = safe("share jsx", onJsx);
        unpatches.push(before("jsx", jsxRuntime, hook));
        unpatches.push(before("jsxs", jsxRuntime, hook));
    },
    stop() {
        for (const u of unpatches.splice(0)) u();
        barPatched = false;
        bar = null;
        rows = null;
        live = 0;
        changed();
    },
};
