export interface Rect { x: number; y: number; width: number; height: number; }
export interface Area { left: number; right: number; top: number; bottom: number; }
export interface Video { key: string; aspect: number; footer?: number; }

export const VIDEO_FOOTER = 40;

function squareGrid(keys: string[], width: number, height: number, gap: number, limit: number) {
    const out = new Map<string, Rect>();
    if (!keys.length) return { rects: out, width: 0, height: 0 };
    const spacing = Math.min(gap, width / (keys.length * 2), height / (keys.length * 2));
    let best = { cols: 1, rows: keys.length, side: 0 };
    for (let cols = 1; cols <= keys.length; cols++) {
        const rows = Math.ceil(keys.length / cols);
        const side = Math.min(limit, (width - spacing * (cols - 1)) / cols, (height - spacing * (rows - 1)) / rows);
        if (side > best.side) best = { cols, rows, side };
    }
    const usedW = best.cols * best.side + spacing * (best.cols - 1);
    const usedH = best.rows * best.side + spacing * (best.rows - 1);
    keys.forEach((key, i) => {
        const row = Math.floor(i / best.cols);
        const count = Math.min(best.cols, keys.length - row * best.cols);
        const rowW = count * best.side + spacing * (count - 1);
        out.set(key, { x: (usedW - rowW) / 2 + (i % best.cols) * (best.side + spacing), y: row * (best.side + spacing), width: best.side, height: best.side });
    });
    return { rects: out, width: usedW, height: usedH };
}

export function splitRects(videos: Video[], voices: string[], area: Area, origin: { x: number; y: number; }, landscape: boolean, fullscreen: boolean) {
    const out = new Map<string, Rect>();
    if (!videos.length) return out;
    const width = Math.max(1, area.right - area.left);
    const height = Math.max(1, area.bottom - area.top);
    const gap = Math.min(fullscreen ? 4 : 6, width / (videos.length * 4), height / (videos.length * 4));
    const voice = squareGrid(voices, landscape ? Math.min(80, width * 0.25) : width, landscape ? height : Math.min(96, height * 0.25), gap, landscape ? 72 : 96);
    const videoW = Math.max(1, width - (landscape && voices.length ? voice.width + gap : 0));
    const videoH = Math.max(1, height - (!landscape && voices.length ? voice.height + gap : 0));
    const aspects = videos.map(() => 16 / 9);
    const footers = videos.map(v => Number.isFinite(v.footer) ? Math.max(0, v.footer!) : 0);
    let rows: number[][] = [];
    let heights: number[] = [];
    let rowFooters: number[] = [];

    const packing = (cols: number) => {
        const candidate = Array.from({ length: Math.ceil(videos.length / cols) }, (_, r) => videos.map((_, i) => i).slice(r * cols, (r + 1) * cols));
        const rowFooters = candidate.map(row => Math.max(...row.map(i => footers[i])));
        const h = Math.min((videoH - gap * (candidate.length - 1) - rowFooters.reduce((sum, h) => sum + h, 0)) / candidate.length, ...candidate.map(row => (videoW - gap * (row.length - 1)) / row.reduce((sum, i) => sum + aspects[i], 0)));
        return { rows: candidate, rowFooters, h };
    };

    if (landscape) {
        let bestHeight = 0;
        for (let cols = videos.length; cols >= 1; cols--) {
            const candidate = packing(cols);
            if (candidate.h > 0 && (!rows.length || candidate.h > bestHeight + 0.5)) {
                bestHeight = candidate.h;
                rows = candidate.rows;
                rowFooters = candidate.rowFooters;
            }
        }
        heights = rows.map(() => bestHeight);
    } else {
        for (let cols = 1; cols <= videos.length; cols++) {
            const candidate = packing(cols);
            if (candidate.h <= 0) continue;
            rows = candidate.rows;
            rowFooters = candidate.rowFooters;
            heights = rows.map(() => candidate.h);
            break;
        }
    }

    if (!rows.length) return out;
    const usedH = heights.reduce((a, b) => a + b, 0) + rowFooters.reduce((a, b) => a + b, 0) + gap * (rows.length - 1);
    const usedW = Math.max(...rows.map((row, r) => row.reduce((sum, i) => sum + heights[r] * aspects[i], 0) + gap * (row.length - 1)));
    const totalW = usedW + (landscape && voices.length ? gap + voice.width : 0);
    const totalH = usedH + (!landscape && voices.length ? gap + voice.height : 0);
    const x0 = area.left - origin.x + (width - totalW) / 2;
    const y0 = area.top - origin.y + (height - totalH) / 2;
    let y = y0;
    rows.forEach((row, r) => {
        const h = heights[r];
        const rowW = row.reduce((sum, i) => sum + h * aspects[i], 0) + gap * (row.length - 1);
        let x = x0 + (usedW - rowW) / 2;
        row.forEach(i => {
            out.set(videos[i].key, { x, y, width: h * aspects[i], height: h });
            x += h * aspects[i] + gap;
        });
        y += h + rowFooters[r] + gap;
    });
    for (const [key, r] of voice.rects) out.set(key, { ...r, x: r.x + (landscape ? x0 + usedW + gap : area.left - origin.x + (width - voice.width) / 2), y: r.y + (landscape ? area.top - origin.y + (height - voice.height) / 2 : y0 + usedH + gap) });
    for (const [key, r] of out) out.set(key, { x: Math.round(r.x), y: Math.round(r.y), width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) });
    return out;
}
