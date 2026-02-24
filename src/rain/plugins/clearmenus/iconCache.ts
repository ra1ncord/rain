type CachedIcon = {
  source?: number;
  iconProp?: unknown;
};

const iconCache = new Map<string, CachedIcon>();

function extractSource(iconProp: any): number | undefined {
  const source =
    iconProp?.source ??
    iconProp?.props?.source ??
    iconProp?.props?.icon?.source ??
    iconProp?.props?.children?.props?.source;
  return typeof source === "number" ? source : undefined;
}

export function setCachedIcon(label: string, iconProp: unknown) {
  if (!label) return;
  const source = extractSource(iconProp as any);
  if (!source && !iconProp) return;
  iconCache.set(label.toLowerCase(), { source, iconProp });
}

export function getCachedIcon(label: string): CachedIcon | undefined {
  return iconCache.get(label.toLowerCase());
}
