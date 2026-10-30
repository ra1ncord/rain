// Locate a callable slot without assuming React components have `.render`.
export function componentTarget(exports: any, exportKey = "default"): { parent: any; key: string } | null {
    let parent = exports;
    let key = exportKey;
    const seen = new Set<any>();
    for (let depth = 0; depth < 6; depth++) {
        const component = parent?.[key];
        if (!component || seen.has(component)) return null;
        seen.add(component);
        if (typeof component === "function") {
            return typeof component.prototype?.render === "function"
                ? { parent: component.prototype, key: "render" } : { parent, key };
        }
        if (typeof component.render === "function") return { parent: component, key: "render" };
        if (component.type) {
            parent = component;
            key = "type";
            continue;
        }
        return null;
    }
    return null;
}
