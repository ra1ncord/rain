import chroma from "chroma-js";
import { parseThemeManifest, type BunnyColorManifest } from "./parser";

let _colorRef: BunnyColorManifest = { colors: {}, semanticColors: {} };

export function getColorRef() {
  return _colorRef;
}

export function clearBunnyColor() {
  _colorRef = { colors: {}, semanticColors: {} };
}

export function updateBunnyColor(input: unknown) {
  const parsed = parseThemeManifest(input);
  _colorRef = parsed;
}

export function withAlpha(hex: string, alpha?: number) {
  try {
    if (alpha == null) return hex;
    const c = chroma(hex).alpha(alpha);
    return c.css();
  } catch {
    return hex;
  }
}
