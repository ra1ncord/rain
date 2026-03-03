import { findAsset } from "@api/assets";

import resolveColor from "./resolveColor";

export function getIconOverlay(plus: any, id: number, style: any): any {
    const asset = findAsset(id);
    if (!asset) return;

    const overlay = plus.customOverlays?.[asset.name];
    if (!overlay) return;

    return {
        replace: overlay.replace,
        style: overlay.style,
        children: overlay.children,
    };
}

export function getIconTint(plus: any, source: any, name: string): string | undefined {
    const tint = plus.icons?.[name];
    if (!tint) return;

    return resolveColor(tint);
}
