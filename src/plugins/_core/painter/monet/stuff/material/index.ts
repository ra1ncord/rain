// Material Color Utilities - ARGB/Hex conversion
// https://github.com/material-foundation/material-color-utilities

export { redFromArgb, greenFromArgb, blueFromArgb } from "./utils";

export function hexFromArgb(argb: number): string {
    const r = (argb >> 16) & 255;
    const g = (argb >> 8) & 255;
    const b = argb & 255;
    const outParts = [r.toString(16), g.toString(16), b.toString(16)];
    for (const [i, part] of outParts.entries()) {
        if (part.length === 1) outParts[i] = `0${part}`;
    }
    return `#${outParts.join("")}`;
}

export function argbFromHex(hex: string): number {
    hex = hex.replace("#", "");
    const isThree = hex.length === 3;
    const isSix = hex.length === 6;
    const isEight = hex.length === 8;
    if (!isThree && !isSix && !isEight) throw new Error(`unexpected hex ${hex}`);
    let r = 0, g = 0, b = 0;
    if (isThree) {
        r = parseIntHex(hex.slice(0, 1).repeat(2));
        g = parseIntHex(hex.slice(1, 2).repeat(2));
        b = parseIntHex(hex.slice(2, 3).repeat(2));
    } else if (isSix) {
        r = parseIntHex(hex.slice(0, 2));
        g = parseIntHex(hex.slice(2, 4));
        b = parseIntHex(hex.slice(4, 6));
    } else if (isEight) {
        r = parseIntHex(hex.slice(2, 4));
        g = parseIntHex(hex.slice(4, 6));
        b = parseIntHex(hex.slice(6, 8));
    }
    return (((255 << 24) | ((r & 0x0ff) << 16) | ((g & 0x0ff) << 8) | (b & 0x0ff)) >>> 0);
}

function parseIntHex(value: string): number {
    return Number.parseInt(value, 16);
}
