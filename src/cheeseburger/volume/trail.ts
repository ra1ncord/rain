export const trail: string[] = [];

export function note(line: string) {
    trail.push(`${new Date().toISOString().slice(17, 23)} ${line}`);
    if (trail.length > 24) trail.shift();
}

export const short = (v: any) => (typeof v === "string" && v.length > 8 ? `…${v.slice(-4)}` : typeof v === "number" ? String(Math.round(v * 1000) / 1000) : typeof v);
