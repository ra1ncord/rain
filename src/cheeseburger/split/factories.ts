import { after, before } from "@api/patcher";
import { findByProps } from "@metro";

import { safe } from "../crash";

let targets = 0;
let jsxCalls = 0;
let elementCalls = 0;

export function watchElementFactories(register: (args: any[]) => any, decorate: (args: any[], ret: any) => any, changed: () => void, active: () => boolean) {
    const patches: (() => unknown)[] = [];
    const watched = new WeakMap<object, Set<string>>();
    const scanned = new WeakSet<object>();
    let starting = true;
    const attach = (target: any) => {
        if (!target || typeof target !== "object") return;
        const keys = typeof target.jsx === "function" && typeof target.jsxs === "function" ? ["jsx", "jsxs", "jsxDEV"] : typeof target.createElement === "function" && typeof target.cloneElement === "function" ? ["createElement"] : [];
        for (const key of keys) {
            if (typeof target[key] !== "function") continue;
            let seen = watched.get(target);
            if (!seen) watched.set(target, seen = new Set());
            if (seen.has(key)) continue;
            seen.add(key);
            patches.push(before(key, target, register));
            patches.push(after(key, target, safe("split element factory", (args: any[], ret: any) => {
                if (key === "createElement") elementCalls++;
                else jsxCalls++;
                return decorate(args, ret);
            })));
            targets++;
        }
    };
    const scan = safe("split element factories", () => {
        if (!starting && !active()) return;
        const previous = targets;
        const modules = (window as any).modules ?? {};
        for (const id of Object.keys(modules)) {
            const module = modules[id];
            if (!module?.isInitialized || scanned.has(module)) continue;
            scanned.add(module);
            const value = module.publicModule?.exports;
            attach(value);
            if (value?.default !== value) attach(value?.default);
        }
        if (!starting && targets !== previous) changed();
    });
    attach(findByProps("createElement", "cloneElement"));
    attach(findByProps("jsx", "jsxs"));
    scan();
    starting = false;
    const timer = setInterval(scan, 3000);
    return () => {
        clearInterval(timer);
        for (const unpatch of patches.splice(0)) unpatch();
    };
}

export const factoryDebug = () => `element factories: ${targets} hooks, jsx ${jsxCalls}, createElement ${elementCalls}`;
