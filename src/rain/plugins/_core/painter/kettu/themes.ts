import { awaitStorage, createStorage } from "@lib/api/storage";
import { writeFile } from "@lib/api/native/fs";
import { logger } from "@lib/utils/logger";
import safeFetch from "@lib/utils/safeFetch";
import { Platform } from "react-native";
import { updateThemeColors, clearThemeColors } from "../patches";
import { ThemesPlusMeta } from "../../painterplus/types";

export interface VendettaThemeManifest {
  semanticColors?: Record<string, string[]>;
  rawColors?: Record<string, string>;
  background?: { url?: string; blur?: number };
  spec?: number;
  theme_color_map?: Record<string, any>;
  plus?: ThemesPlusMeta;
}

export interface VdThemeInfo {
  id: string;
  selected: boolean;
  data: VendettaThemeManifest;
}

export const themes = createStorage<Record<string, VdThemeInfo>>("themer/kettu/themes.json", { dflt: {} });

export async function writeThemeToNative(theme: VdThemeInfo | {}) {
  await writeFile("../vendetta_theme.json", JSON.stringify(theme ?? {}));
}

function normalizeToHex(hex?: string): string | false {
  if (!hex) return false;
  if (typeof hex === "string" && hex.startsWith("#")) return hex;
  return `#${hex}`;
}

function applyAndroidAlphaKeys(raw: Record<string, string>) {
  Object.keys(raw).forEach(k => {
    const v = raw[k];
    if (v && /^#([0-9a-fA-F]{8})$/.test(v)) {
    }
  });
}

function processData(data: VendettaThemeManifest): VendettaThemeManifest {
  if (data.plus) {
    data.plus = {
      ...data.plus,
      version: typeof data.plus.version === "string" ? Number(data.plus.version) : data.plus.version,
    } as ThemesPlusMeta;
  }
  if (data.semanticColors) {
    for (const key in data.semanticColors) {
      const arr = data.semanticColors[key];
      if (Array.isArray(arr) && arr[0]) data.semanticColors[key][0] = normalizeToHex(arr[0]) || arr[0];
    }
  }
  if (data.rawColors) {
    for (const key in data.rawColors) {
      const norm = normalizeToHex(data.rawColors[key]);
      if (norm) data.rawColors[key] = norm;
    }
    if (Platform.OS === "android") applyAndroidAlphaKeys(data.rawColors);
  }
  if (data.spec === undefined) {
    if (!("theme_color_map" in data)) data.spec = 2;
  }
  return data;
}

function validateTheme(themeJSON: any): boolean {
  if (typeof themeJSON !== "object" || themeJSON === null) return false;
  if (themeJSON.spec === 3 && !themeJSON.main) return false;
  if (themeJSON.spec === 2) return true;
  if (themeJSON.theme_color_map) return true;
  return themeJSON.spec === 2 || themeJSON.spec === 3;
}

function normalizeForeignTheme(src: any): VendettaThemeManifest {
  const out: VendettaThemeManifest = { spec: 2 } as any;

  const plus = src?.plus || src?.manifest?.plus;
  if (plus && typeof plus === "object") out.plus = plus as ThemesPlusMeta;

  const bg = src?.background || src?.manifest?.background;
  if (bg?.url) out.background = { url: bg.url, blur: bg.blur ?? bg.blur_radius } as any;

  const rawColorsCandidates = [src?.rawColors, src?.colors, src?.main];
  for (const cand of rawColorsCandidates) {
    if (cand && typeof cand === "object") {
      out.rawColors = {} as Record<string, string>;
      for (const [k, v] of Object.entries(cand)) {
        if (typeof v === "string") (out.rawColors as any)[k] = v;
        else if (typeof v === "number") (out.rawColors as any)[k] = `#${v.toString(16)}`;
      }
      break;
    }
  }

  const sem = src?.semanticColors || src?.theme_color_map;
  if (sem && typeof sem === "object") {
    out.semanticColors = {} as Record<string, string[]>;
    for (const [k, v] of Object.entries(sem)) {
      if (Array.isArray(v) && v.length) (out.semanticColors as any)[k] = v as string[];
      else if (typeof v === "string") (out.semanticColors as any)[k] = [v];
    }
  }

  return out;
}

export async function fetchTheme(url: string, selected = false) {
  let themeJSON: any;
  try {
    const res = await safeFetch(url, { cache: "no-store" });
    themeJSON = await res.json();
  } catch (e) {
    throw new Error(`Failed to fetch theme at ${url}`);
  }
  if (!validateTheme(themeJSON)) {
    try {
      const normalized = normalizeForeignTheme(themeJSON);
      if (validateTheme(normalized)) themeJSON = normalized;
    } catch {}
  }
  if (!validateTheme(themeJSON)) throw new Error(`Invalid theme at ${url}`);
  themes[url] = { id: url, selected, data: processData(themeJSON) };
  if (selected) {
    await writeThemeToNative(themes[url]);
  }
}

export async function installTheme(url: string) {
  if (typeof url !== "string" || url in (themes as any)) throw new Error("Theme already installed");
  await fetchTheme(url);
}

export function selectTheme(theme: VdThemeInfo | null, write = true) {
  if (theme) theme.selected = true;
  Object.keys(themes).forEach(k => (themes as any)[k].selected = (themes as any)[k].id === theme?.id);
  if (theme == null && write) {
    clearThemeColors();
    return writeThemeToNative({});
  } else if (theme) {

    try {
      const { ThemeManager } = require("../ThemeManager");
      ThemeManager.clearTheme();
    } catch {}
    updateThemeColors(theme.data);
    return writeThemeToNative(theme);
  }
}

function numberToHex(color: number): string {
  const hex = color.toString(16).padStart(color > 0xffffff ? 8 : 6, "0");
  return `#${hex}`;
}

export async function selectThemeFromManager(name: string, content: { colors?: Record<string, number>; simple_colors?: Record<string, number>; plus?: ThemesPlusMeta }) {
  const semanticColors: Record<string, string[]> = {};
  const rawColors: Record<string, string> = {};
  const push = (k: string, v: number) => {
    const hex = numberToHex(v);
    semanticColors[k] = [hex];
    rawColors[k] = hex;
  };
  for (const [k, v] of Object.entries(content.simple_colors ?? {})) push(k, v);
  for (const [k, v] of Object.entries(content.colors ?? {})) push(k, v);
  const data: VendettaThemeManifest = { semanticColors, rawColors, spec: 2 };
  if (content.plus) data.plus = { ...content.plus, version: typeof content.plus.version === "string" ? Number(content.plus.version) : content.plus.version } as any;
  updateThemeColors(data);
  await writeThemeToNative({ id: name, selected: true, data });
}

export async function removeTheme(id: string) {
  const theme = (themes as any)[id];
  if (theme?.selected) await selectTheme(null);
  delete (themes as any)[id];
  return !!theme?.selected;
}

export async function updateThemes() {
  await awaitStorage(themes);
}

export function getCurrentTheme() {
  return Object.values((themes as any)).find((t: any) => t.selected) ?? null;
}

export function getStoredTheme(): VdThemeInfo | null {
  const ct = getCurrentTheme();
  return ct as unknown as VdThemeInfo | null;
}

function convertBuiltinToKettu(builtin: any): VendettaThemeManifest {
  const semanticColors: Record<string, string[]> = {};
  const rawColors: Record<string, string> = {};
  
  const toHex = (num: number) => `#${num.toString(16).padStart(num > 0xffffff ? 8 : 6, "0")}`;
  
  if (builtin.colors) {
    for (const [key, value] of Object.entries(builtin.colors)) {
      const hex = toHex(value as number);
      semanticColors[key] = [hex];
      rawColors[key] = hex;
    }
  }
  
  if (builtin.simple_colors) {
    for (const [key, value] of Object.entries(builtin.simple_colors)) {
      const hex = toHex(value as number);
      semanticColors[key] = [hex];
      rawColors[key] = hex;
    }
  }
  
  return {
    semanticColors,
    rawColors,
    background: builtin.background ? {
      url: builtin.background.url,
      blur: builtin.background.blur_radius ?? 0,
    } : undefined,
    plus: (() => {
      const plus = builtin.plus ?? {};
      // Prefer manifest.version for theme version if available
      const mv = builtin.manifest?.version;
      const parsed = typeof mv === "string" ? Number(mv) : mv;
      return { ...plus, version: typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : plus.version };
    })(),
    spec: 2,
  };
}

export async function initThemes() {
  try {
    await updateThemes();
    
    // Pre-install built-in themes as Kettu themes
    const { BUILTIN_THEMES } = await import("../builtinThemes");
    for (const [name, content] of Object.entries(BUILTIN_THEMES)) {
      const builtinId = `builtin:${name}`;
      if (!themes[builtinId]) {
        themes[builtinId] = {
          id: builtinId,
          selected: false,
          data: convertBuiltinToKettu(content),
        };
      }
    }
    
    const current = getStoredTheme();
    if (current) {
      updateThemeColors(current.data);
      await writeThemeToNative(current);
    }
    // Don't clear colors here; let the main startup logic handle theme application
  } catch (e) {
    logger.error("[Themer] Failed to initialize Kettu themes", e);
  }
}
