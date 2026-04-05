function isValid(val: any) {
    if (val === false || val === 0) return true;
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0;
    return true;
}

export function cloneAndFilter<T extends object>(obj: T): T {
    const filter = (key: PropertyKey, value: any) => {
        if (value === obj) return value;
        if (typeof key === "string" && key.startsWith("_")) return undefined;
        return isValid(value) ? value : undefined;
    };

    return JSON.parse(JSON.stringify(obj, filter));
}
