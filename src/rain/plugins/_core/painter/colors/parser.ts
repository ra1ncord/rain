
export type BunnyColorManifest = {
  colors?: Record<string, string>;
  semanticColors?: Record<string, string>;
};

export function parseThemeManifest(input: unknown): BunnyColorManifest {
  if (!input || typeof input !== "object") return { colors: {}, semanticColors: {} };
  const obj = input as any;

  const colors: Record<string, string> = {};
  const semanticColors: Record<string, string> = {};

  if (obj.colors && typeof obj.colors === "object") {
    for (const [k, v] of Object.entries(obj.colors)) {
      if (typeof v === "string") colors[k] = v;
    }
  }

  if (obj.semanticColors && typeof obj.semanticColors === "object") {
    for (const [k, v] of Object.entries(obj.semanticColors)) {
      if (typeof v === "string") semanticColors[k] = v;
    }
  }

  if (obj.rawColors && typeof obj.rawColors === "object") {
    for (const [k, v] of Object.entries(obj.rawColors)) {
      if (typeof v === "string") colors[k] = v;
    }
  }

  if (obj.colors?.semantic && typeof obj.colors.semantic === "object") {
    for (const [k, v] of Object.entries(obj.colors.semantic)) {
      if (typeof v === "string") semanticColors[k] = v;
    }
  }

  return { colors, semanticColors };
}
