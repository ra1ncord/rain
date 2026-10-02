export interface Rect { x: number; y: number; width: number; height: number; z?: number; }
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

const clampAspect = (a: number) => (Number.isFinite(a) && a > 0 ? Math.min(2.4, Math.max(0.45, a)) : 16 / 9);

export function stageRects(videos: Video[], voices: string[], mainKey: string, area: Area, origin: { x: number; y: number; }, fullscreen: boolean) {
    const out = new Map<string, Rect>();
    if (!videos.length) return out;
    const width = Math.max(1, area.right - area.left);
    const height = Math.max(1, area.bottom - area.top);
    const gap = fullscreen ? 6 : 8;
    const main = videos.find(v => v.key === mainKey) ?? videos[0];
    const mainAspect = clampAspect(main.aspect);
    const floaters = [
        ...videos.filter(v => v !== main).map(v => ({ key: v.key, aspect: clampAspect(v.aspect) })),
        ...voices.map(key => ({ key, aspect: 1 })),
    ];
    const mw = Math.min(width, height * mainAspect);
    const mh = mw / mainAspect;
    const put = (key: string, x: number, y: number, w: number, h: number, z: number) => out.set(key, {
        x: Math.round(x - origin.x), y: Math.round(y - origin.y), width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)), z,
    });

    if (!floaters.length) {
        put(main.key, area.left + (width - mw) / 2, area.top + (height - mh) / 2, mw, mh, 1);
        return out;
    }

    const column = width - mw - gap;
    const gaps = gap * (floaters.length - 1);
    let sizes = floaters.map(f => (column > 0 ? Math.min(height * (f.aspect < 1 ? 0.45 : 0.3), column / f.aspect) : 0));
    const stacked = sizes.reduce((a, b) => a + b, 0);
    if (stacked + gaps > height && stacked > 0) sizes = sizes.map(h => h * Math.max(0, height - gaps) / stacked);

    if (column > 0 && Math.min(...sizes) >= height * 0.16) {
        const colW = Math.max(...floaters.map((f, i) => sizes[i] * f.aspect));
        const x0 = area.left + (width - (mw + gap + colW)) / 2;
        put(main.key, x0, area.top + (height - mh) / 2, mw, mh, 1);
        const used = sizes.reduce((a, b) => a + b, 0) + gaps;
        let y = area.top + (height - used) / 2;
        floaters.forEach((f, i) => {
            const w = sizes[i] * f.aspect;
            put(f.key, x0 + mw + gap + (colW - w) / 2, y, w, sizes[i], 2);
            y += sizes[i] + gap;
        });
        return out;
    }

    const mx = area.left + (width - mw) / 2;
    const my = area.top + (height - mh) / 2;
    put(main.key, mx, my, mw, mh, 1);
    const fh = Math.max(1, Math.min(height * 0.26, (height - gap * (floaters.length + 1)) / floaters.length));
    const right = Math.min(area.right, mx + mw) - gap;
    let bottom = Math.min(area.bottom, my + mh) - gap;
    floaters.forEach(f => {
        const w = Math.min(fh * f.aspect, width * 0.4);
        const h = w / f.aspect;
        put(f.key, right - w, bottom - h, w, h, 2);
        bottom -= h + gap;
    });
    return out;
}
