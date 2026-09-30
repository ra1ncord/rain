import { findAssetId } from "@api/assets";
import { before, instead } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { React } from "@metro/common";
import { TableRow } from "@metro/common/components";

import { caught, safe, safeInstead } from "../crash";
import { iconComponent } from "../toolbar";

const TOOLBAR = /\/VoicePanelScreenshareButton\.tsx$/;
const KEY = "cheeseburger-share";

const unpatches: (() => unknown)[] = [];
const listeners = new Set<() => void>();
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

const SHARE_LABEL = /share your screen|screen ?shar|stop (?:sharing|streaming)|go live/i;
const ANCHOR_LABEL = /^(?:show chat|hide chat|activities)$/i;
const SHARE_ICONS = ["MobilePhoneShareIcon", "ScreenArrowIcon", "ScreenIcon"];
const DROP = new Set(["onPress", "onLongPress", "label", "subLabel", "icon", "trailing", "arrow", "value", "onValueChange", "accessibilityLabel", "accessibilityHint", "start", "end", "children", "disabled"]);

let share: { label: string; onPress: () => void; } | null = null;

const press = () => {
    try {
        share?.onPress();
    } catch (e) {
        caught("share press", e);
    }
};
(press as any).__cheeseburgerShare = true;

function shareIcon(icon: any): any {
    const id = SHARE_ICONS.map(n => findAssetId(n)).find(x => x !== undefined);
    const comp = SHARE_ICONS.map(iconComponent).find(Boolean);
    if (icon && typeof icon === "object" && "props" in icon) {
        if (icon.props?.source != null && id !== undefined) return React.cloneElement(icon, { source: id });
        if (comp) return React.createElement(comp, icon.props);
    }
    if (typeof icon === "function" && comp) return comp;
    return id !== undefined ? <TableRow.Icon source={id} /> : undefined;
}

function MenuShare({ base }: { base: any; }) {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        listeners.add(force);
        live++;
        changed();
        return () => {
            listeners.delete(force);
            live = Math.max(0, live - 1);
            changed();
        };
    }, []);
    const props: any = {};
    for (const k of Object.keys(base.props ?? {})) if (!DROP.has(k)) props[k] = base.props[k];
    return React.createElement(base.type, {
        ...props,
        label: share?.label ?? "Share Your Screen",
        accessibilityLabel: share?.label ?? "Share Your Screen",
        icon: shareIcon(base.props?.icon),
        onPress: press,
    });
}

function ToolbarShare({ children }: { children?: any; }) {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        listeners.add(force);
        return () => void listeners.delete(force);
    }, []);
    return live > 0 ? null : children ?? null;
}

function ensure() {
    const now = Date.now();
    if (barPatched || now - lastLook < 2000) return;
    lastLook = now;
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

function anchorIn(ch: any[]): number {
    let at = -1;
    for (let i = 0; i < ch.length; i++) {
        const c = ch[i];
        if (!c || typeof c !== "object" || !c.props) continue;
        if (c.key === KEY) return -2;
        const label = c.props.label;
        if (typeof label === "string" && ANCHOR_LABEL.test(label.trim())) {
            at = i;
            if (/chat/i.test(label)) break;
        }
    }
    return at;
}

function onJsx(args: any[]) {
    const type = args[0];
    if (!barPatched && typeof type === "function" && type.name === "VideoButton") ensure();
    const props = args[1];
    if (!props || typeof props !== "object") return;
    const label = props.accessibilityLabel;
    if (typeof props.onPress === "function" && !props.onPress.__cheeseburgerShare && typeof label === "string" && SHARE_LABEL.test(label)) {
        const changedLabel = share?.label !== label;
        share = { label, onPress: props.onPress };
        if (changedLabel) changed();
    }
    const ch = props.children;
    if (!share || !Array.isArray(ch) || ch.length < 2 || ch.length > 40) return;
    const at = anchorIn(ch);
    if (at < 0) return;
    placed++;
    const row = <Guard key={KEY}><MenuShare base={ch[at]} /></Guard>;
    args[1] = { ...props, children: [...ch.slice(0, at + 1), row, ...ch.slice(at + 1)] };
    return args;
}

export function shareDebug(): string[] {
    return [
        `share: button ${share ? `"${share.label}"` : "not seen yet"}, toolbar ${barPatched ? "hooked" : "not yet"}, placed ${placed}, showing ${live}${failures ? `, failed ${failures} (${lastError})` : ""}`,
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
        share = null;
        live = 0;
        changed();
    },
};
