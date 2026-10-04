/* eslint-disable @typescript-eslint/no-explicit-any */

export type Tool = 'select' | 'edit' | 'text' | 'whiteout' | 'highlight' | 'rect' | 'ellipse' | 'line' | 'draw' | 'image';
export type FontKey = 'Helvetica' | 'Times' | 'Courier' | 'Unicode';

export interface TextAnn { id: string; type: 'text'; x: number; y: number; text: string; font: FontKey; size: number; color: string; bold: boolean; italic: boolean }
export interface ShapeAnn { id: string; type: 'shape'; kind: 'rect' | 'ellipse' | 'highlight' | 'whiteout'; x: number; y: number; w: number; h: number; fill: string; stroke: string; strokeW: number; opacity: number }
export interface LineAnn { id: string; type: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeW: number; opacity: number }
export interface DrawAnn { id: string; type: 'draw'; points: number[][]; stroke: string; strokeW: number; opacity: number }
export interface ImageAnn { id: string; type: 'image'; x: number; y: number; w: number; h: number; src: string; opacity: number }
export type Ann = TextAnn | ShapeAnn | LineAnn | DrawAnn | ImageAnn;
export type Snap = Record<number, Ann[]>;

export interface Style {
    font: FontKey; size: number; color: string; bold: boolean; italic: boolean;
    fill: string; stroke: string; strokeW: number; opacity: number; hl: string; wo: string;
}

export const DEFAULT_STYLE: Style = {
    font: 'Helvetica', size: 16, color: '#000000', bold: false, italic: false,
    fill: '', stroke: '#e11d48', strokeW: 2, opacity: 1, hl: '#fde047', wo: '#ffffff',
};

export const CSS_FONT: Record<FontKey, string> = {
    Helvetica: 'Helvetica, Arial, "Liberation Sans", sans-serif',
    Times: '"Times New Roman", Times, "Liberation Serif", serif',
    Courier: '"Courier New", Courier, monospace',
    Unicode: '"Noto Sans", "Noto Naskh Arabic", "Noto Sans Tamil", "Segoe UI", "Nirmala UI", Arial, sans-serif',
};

export const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const NON_LATIN_RE = /[^\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/;

export const uid = () => Math.random().toString(36).slice(2, 10);
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const tick = () => new Promise<void>((r) => setTimeout(r, 20));

function hexToRgb01(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h || '000000', 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const toHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

function dataUrlToBytes(url: string): Uint8Array {
    const bin = atob(url.split(',')[1] || '');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

async function renderToCanvas(page: any, scale: number) {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    return canvas;
}

function canvasToBytes(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (b) => {
            if (!b) return reject(new Error('Export failed'));
            resolve(new Uint8Array(await b.arrayBuffer()));
        }, type, quality);
    });
}

/* ---------- text segments (Edit text tool) ---------- */

export interface Seg { text: string; x: number; base: number; w: number; size: number; font: FontKey; rtl: boolean }

export function buildSegs(items: any[], styles: any, vp: any): Seg[] {
    type Tok = { str: string; x: number; base: number; w: number; size: number; family: string };
    const toks: Tok[] = items
        .filter((i) => typeof i.str === 'string' && i.str.trim() !== '')
        .map((i) => {
            const [px, py] = vp.convertToViewportPoint(i.transform[4], i.transform[5]);
            return {
                str: i.str as string, x: px, base: py, w: (i.width as number) || 0,
                size: Math.hypot(i.transform[2], i.transform[3]) || 10,
                family: String(styles?.[i.fontName]?.fontFamily || ''),
            };
        })
        .sort((a, b) => (Math.abs(a.base - b.base) > 0.5 ? a.base - b.base : a.x - b.x));

    const rows: Tok[][] = [];
    for (const t of toks) {
        const cur = rows[rows.length - 1];
        if (cur && Math.abs(cur[0].base - t.base) <= Math.max(2, t.size * 0.4)) cur.push(t);
        else rows.push([t]);
    }

    const out: Seg[] = [];
    for (const row of rows) {
        const rtl = RTL_RE.test(row.map((t) => t.str).join(''));
        row.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
        let cur: Tok[] = [];
        const flush = () => {
            if (!cur.length) return;
            let text = '';
            let prev: Tok | null = null;
            for (const t of cur) {
                if (prev) {
                    const gap = rtl ? prev.x - (t.x + t.w) : t.x - (prev.x + prev.w);
                    if (gap > t.size * 0.12 && !text.endsWith(' ') && !t.str.startsWith(' ')) text += ' ';
                }
                text += t.str;
                prev = t;
            }
            text = text.trim();
            if (text) {
                const x0 = Math.min(...cur.map((t) => t.x));
                const x1 = Math.max(...cur.map((t) => t.x + t.w));
                const fam = cur[0].family;
                const font: FontKey = NON_LATIN_RE.test(text)
                    ? 'Unicode'
                    : /mono|courier/i.test(fam) ? 'Courier'
                        : /serif/i.test(fam) && !/sans/i.test(fam) ? 'Times' : 'Helvetica';
                out.push({ text, x: x0, base: cur[0].base, w: x1 - x0, size: cur[0].size, font, rtl });
            }
            cur = [];
        };
        let prevTok: Tok | null = null;
        for (const t of row) {
            if (prevTok) {
                const gap = rtl ? prevTok.x - (t.x + t.w) : t.x - (prevTok.x + prevTok.w);
                if (gap > t.size) flush();
            }
            cur.push(t);
            prevTok = t;
        }
        flush();
    }
    return out;
}

export function sampleColors(canvas: HTMLCanvasElement, f: number, x: number, y: number, w: number, h: number) {
    try {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no ctx');
        const sx = clamp(Math.floor((x - 2) * f), 0, canvas.width - 2);
        const sy = clamp(Math.floor((y - 2) * f), 0, canvas.height - 2);
        const sw = clamp(Math.ceil((w + 4) * f), 2, canvas.width - sx);
        const sh = clamp(Math.ceil((h + 4) * f), 2, canvas.height - sy);
        const d = ctx.getImageData(sx, sy, sw, sh).data;
        let r = 0, g = 0, b = 0, n = 0;
        const addPx = (px: number, py: number) => {
            const i = (py * sw + px) * 4;
            r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        };
        for (let px = 0; px < sw; px++) { addPx(px, 0); addPx(px, sh - 1); }
        for (let py = 0; py < sh; py++) { addPx(0, py); addPx(sw - 1, py); }
        const br = r / n, bg = g / n, bb = b / n;
        let best = 0, fr = 0, fg = 0, fb = 0;
        for (let i = 0; i < d.length; i += 4) {
            const diff = Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb);
            if (diff > best) { best = diff; fr = d[i]; fg = d[i + 1]; fb = d[i + 2]; }
        }
        const lum = (br * 299 + bg * 587 + bb * 114) / 1000;
        return { bg: toHex(br, bg, bb), fg: best < 120 ? (lum > 128 ? '#000000' : '#ffffff') : toHex(fr, fg, fb) };
    } catch {
        return { bg: '#ffffff', fg: '#000000' };
    }
}

/* ---------- drawing ---------- */

let measureCtx: CanvasRenderingContext2D | null = null;
const fontCss = (a: TextAnn, k: number) => `${a.italic ? 'italic ' : ''}${a.bold ? 'bold ' : ''}${a.size * k}px ${CSS_FONT[a.font]}`;

export function measureTextAnn(a: TextAnn) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    const lines = a.text.split('\n');
    let w = 0;
    if (measureCtx) {
        measureCtx.font = fontCss(a, 10);
        for (const l of lines) w = Math.max(w, measureCtx.measureText(l || ' ').width / 10);
    }
    return { w: Math.max(w, a.size * 0.6), h: Math.max(1, lines.length) * a.size * 1.2 };
}

export function drawAnn(ctx: CanvasRenderingContext2D, a: Ann, k: number, imgs: Map<string, HTMLImageElement>) {
    ctx.save();
    if (a.type === 'shape') {
        ctx.globalAlpha = a.opacity;
        if (a.kind === 'highlight') ctx.globalCompositeOperation = 'multiply';
        ctx.beginPath();
        if (a.kind === 'ellipse') ctx.ellipse((a.x + a.w / 2) * k, (a.y + a.h / 2) * k, Math.max(0.1, (a.w / 2) * k), Math.max(0.1, (a.h / 2) * k), 0, 0, Math.PI * 2);
        else ctx.rect(a.x * k, a.y * k, a.w * k, a.h * k);
        if (a.fill) { ctx.fillStyle = a.fill; ctx.fill(); }
        if (a.stroke && a.strokeW > 0) { ctx.lineWidth = a.strokeW * k; ctx.strokeStyle = a.stroke; ctx.stroke(); }
    } else if (a.type === 'line') {
        ctx.globalAlpha = a.opacity;
        ctx.lineCap = 'round';
        ctx.lineWidth = a.strokeW * k;
        ctx.strokeStyle = a.stroke;
        ctx.beginPath();
        ctx.moveTo(a.x1 * k, a.y1 * k);
        ctx.lineTo(a.x2 * k, a.y2 * k);
        ctx.stroke();
    } else if (a.type === 'draw') {
        ctx.globalAlpha = a.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = a.strokeW * k;
        ctx.strokeStyle = a.stroke;
        ctx.beginPath();
        a.points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px * k, py * k) : ctx.lineTo(px * k, py * k)));
        if (a.points.length === 1) ctx.lineTo(a.points[0][0] * k + 0.01, a.points[0][1] * k);
        ctx.stroke();
    } else if (a.type === 'image') {
        const im = imgs.get(a.id);
        if (im && im.complete) {
            ctx.globalAlpha = a.opacity;
            ctx.drawImage(im, a.x * k, a.y * k, a.w * k, a.h * k);
        }
    } else if (a.type === 'text') {
        const { w } = measureTextAnn(a);
        ctx.font = fontCss(a, k);
        ctx.fillStyle = a.color;
        ctx.textBaseline = 'alphabetic';
        a.text.split('\n').forEach((line, i) => {
            const rtl = RTL_RE.test(line);
            ctx.direction = rtl ? 'rtl' : 'ltr';
            ctx.textAlign = rtl ? 'right' : 'left';
            ctx.fillText(line, (rtl ? a.x + w : a.x) * k, (a.y + a.size * (0.94 + 1.2 * i)) * k);
        });
    }
    ctx.restore();
}

export function bboxOf(a: Ann) {
    if (a.type === 'text') { const m = measureTextAnn(a); return { x: a.x, y: a.y, w: m.w, h: m.h }; }
    if (a.type === 'shape' || a.type === 'image') return { x: a.x, y: a.y, w: a.w, h: a.h };
    if (a.type === 'line') return { x: Math.min(a.x1, a.x2), y: Math.min(a.y1, a.y2), w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
    const xs = a.points.map((p) => p[0]);
    const ys = a.points.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

function segDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function hits(a: Ann, x: number, y: number) {
    if (a.type === 'line') return segDist(x, y, a.x1, a.y1, a.x2, a.y2) <= Math.max(6, a.strokeW);
    if (a.type === 'draw') {
        if (a.points.length === 1) return Math.hypot(x - a.points[0][0], y - a.points[0][1]) <= 6;
        for (let i = 1; i < a.points.length; i++) {
            if (segDist(x, y, a.points[i - 1][0], a.points[i - 1][1], a.points[i][0], a.points[i][1]) <= Math.max(6, a.strokeW)) return true;
        }
        return false;
    }
    const b = bboxOf(a);
    return x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4;
}

export function translateAnn(a: Ann, dx: number, dy: number): Ann {
    if (a.type === 'line') return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy };
    if (a.type === 'draw') return { ...a, points: a.points.map(([x, y]) => [x + dx, y + dy]) };
    return { ...a, x: a.x + dx, y: a.y + dy } as Ann;
}

export function applyPatch(a: Ann, p: Partial<Style>): Ann {
    const o: any = { ...a };
    const copy = (keys: string[]) => keys.forEach((k) => { if (k in p) o[k] = (p as any)[k]; });
    if (a.type === 'text') copy(['font', 'size', 'color', 'bold', 'italic']);
    else if (a.type === 'shape') {
        if (a.kind === 'highlight') { if ('hl' in p) o.fill = p.hl; }
        else if (a.kind === 'whiteout') { if ('wo' in p) o.fill = p.wo; }
        else copy(['fill', 'stroke', 'strokeW', 'opacity']);
    } else if (a.type === 'line' || a.type === 'draw') copy(['stroke', 'strokeW', 'opacity']);
    else if (a.type === 'image') copy(['opacity']);
    return o;
}

/* ---------- export ---------- */

function stdFontName(a: TextAnn): string {
    const b = a.bold, i = a.italic;
    if (a.font === 'Times') return b && i ? 'TimesRomanBoldItalic' : b ? 'TimesRomanBold' : i ? 'TimesRomanItalic' : 'TimesRoman';
    if (a.font === 'Courier') return b && i ? 'CourierBoldOblique' : b ? 'CourierBold' : i ? 'CourierOblique' : 'Courier';
    return b && i ? 'HelveticaBoldOblique' : b ? 'HelveticaBold' : i ? 'HelveticaOblique' : 'Helvetica';
}

async function rasterText(a: TextAnn) {
    const K = 4;
    const pad = 2;
    const m = measureTextAnn(a);
    const c = document.createElement('canvas');
    c.width = Math.ceil((m.w + pad * 2) * K);
    c.height = Math.ceil((m.h + pad * 2) * K);
    const ctx = c.getContext('2d')!;
    ctx.translate((pad - a.x) * K, (pad - a.y) * K);
    drawAnn(ctx, a, K, new Map());
    const bytes = await canvasToBytes(c, 'image/png');
    c.width = 0;
    c.height = 0;
    return { bytes, m, pad };
}

async function ensureImages(anns: Snap, imgs: Map<string, HTMLImageElement>) {
    const jobs: Promise<void>[] = [];
    Object.values(anns).flat().forEach((a) => {
        if (a.type !== 'image') return;
        const existing = imgs.get(a.id);
        if (existing && existing.complete) return;
        jobs.push(new Promise<void>((res) => {
            const im = new Image();
            im.onload = () => res();
            im.onerror = () => res();
            im.src = a.src;
            imgs.set(a.id, im);
        }));
    });
    await Promise.all(jobs);
}

export interface ExportOpts {
    file: File;
    doc: any;
    anns: Snap;
    imgs: Map<string, HTMLImageElement>;
    flatten: boolean;
    pageCount: number;
    onProgress: (p: number, msg: string) => void;
    isCancelled: () => boolean;
}

export async function exportPdf(o: ExportOpts): Promise<Blob | null> {
    const lib: any = await import('pdf-lib');
    const { PDFDocument, StandardFonts, rgb, degrees, LineCapStyle, BlendMode } = lib;
    await ensureImages(o.anns, o.imgs);

    if (o.flatten) {
        const pdf = await PDFDocument.create();
        for (let i = 0; i < o.pageCount; i++) {
            if (o.isCancelled()) return null;
            o.onProgress((i / o.pageCount) * 90, `Rendering page ${i + 1} of ${o.pageCount}`);
            const page = await o.doc.getPage(i + 1);
            const vp1 = page.getViewport({ scale: 1 });
            const sc = Math.min(2.5, 4000 / Math.max(vp1.width, vp1.height));
            const canvas = await renderToCanvas(page, sc);
            const ctx = canvas.getContext('2d')!;
            (o.anns[i] || []).forEach((a) => drawAnn(ctx, a, sc, o.imgs));
            const jpg = await canvasToBytes(canvas, 'image/jpeg', 0.92);
            canvas.width = 0;
            canvas.height = 0;
            const img = await pdf.embedJpg(jpg);
            const p = pdf.addPage([vp1.width, vp1.height]);
            p.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
            await tick();
        }
        o.onProgress(95, 'Saving...');
        return new Blob([(await pdf.save()) as any], { type: 'application/pdf' });
    }

    const pdf = await PDFDocument.load(new Uint8Array(await o.file.arrayBuffer()), { ignoreEncryption: true });
    const pages = pdf.getPages();
    const fonts = new Map<string, any>();
    const withAnns = Object.keys(o.anns).map(Number).filter((i) => (o.anns[i] || []).length > 0 && i < pages.length);

    for (let n = 0; n < withAnns.length; n++) {
        if (o.isCancelled()) return null;
        const i = withAnns[n];
        o.onProgress((n / Math.max(1, withAnns.length)) * 90, `Saving page ${i + 1}`);
        const page = pages[i];
        const cb = page.getCropBox ? page.getCropBox() : page.getMediaBox();
        const ox = cb.x, oy = cb.y, W = cb.width, H = cb.height;
        const rot = ((page.getRotation().angle % 360) + 360) % 360;
        const list = o.anns[i];

        if (rot !== 0) {
            const vw = rot === 90 || rot === 270 ? H : W;
            const vh = rot === 90 || rot === 270 ? W : H;
            const K = 3;
            const c = document.createElement('canvas');
            c.width = Math.ceil(vw * K);
            c.height = Math.ceil(vh * K);
            const ctx = c.getContext('2d')!;
            list.forEach((a) => drawAnn(ctx, a, K, o.imgs));
            const img = await pdf.embedPng(await canvasToBytes(c, 'image/png'));
            c.width = 0;
            c.height = 0;
            const ax = rot === 270 ? ox : ox + W;
            const ay = rot === 90 ? oy : oy + H;
            page.drawImage(img, { x: rot === 90 || rot === 180 ? ax : ox, y: rot === 90 ? oy : ay, width: vw, height: vh, rotate: degrees(rot) });
            continue;
        }

        const fx = (x: number) => ox + x;
        const fy = (y: number) => oy + H - y;

        for (const a of list) {
            if (a.type === 'shape') {
                const fill = a.fill ? rgb(...hexToRgb01(a.fill)) : null;
                const stroke = a.stroke && a.strokeW > 0 ? rgb(...hexToRgb01(a.stroke)) : null;
                if (!fill && !stroke) continue;
                const base: any = {};
                if (fill) { base.color = fill; base.opacity = a.opacity; }
                if (stroke) { base.borderColor = stroke; base.borderWidth = a.strokeW; base.borderOpacity = a.opacity; }
                if (a.kind === 'highlight') base.blendMode = BlendMode.Multiply;
                if (a.kind === 'ellipse') page.drawEllipse({ x: fx(a.x + a.w / 2), y: fy(a.y + a.h / 2), xScale: a.w / 2, yScale: a.h / 2, ...base });
                else page.drawRectangle({ x: fx(a.x), y: fy(a.y + a.h), width: a.w, height: a.h, ...base });
            } else if (a.type === 'line') {
                page.drawLine({
                    start: { x: fx(a.x1), y: fy(a.y1) }, end: { x: fx(a.x2), y: fy(a.y2) },
                    thickness: a.strokeW, color: rgb(...hexToRgb01(a.stroke)), opacity: a.opacity, lineCap: LineCapStyle.Round,
                });
            } else if (a.type === 'draw') {
                const col = rgb(...hexToRgb01(a.stroke));
                const pts = a.points.length === 1 ? [a.points[0], [a.points[0][0] + 0.01, a.points[0][1]]] : a.points;
                for (let j = 1; j < pts.length; j++) {
                    page.drawLine({
                        start: { x: fx(pts[j - 1][0]), y: fy(pts[j - 1][1]) }, end: { x: fx(pts[j][0]), y: fy(pts[j][1]) },
                        thickness: a.strokeW, color: col, opacity: a.opacity, lineCap: LineCapStyle.Round,
                    });
                }
            } else if (a.type === 'image') {
                const img = await pdf.embedPng(dataUrlToBytes(a.src));
                page.drawImage(img, { x: fx(a.x), y: fy(a.y + a.h), width: a.w, height: a.h, opacity: a.opacity });
            } else if (a.type === 'text') {
                if (!a.text.trim()) continue;
                const name = stdFontName(a);
                let font = fonts.get(name);
                if (!font) { font = await pdf.embedFont(StandardFonts[name]); fonts.set(name, font); }
                let vector = a.font !== 'Unicode' && !RTL_RE.test(a.text);
                if (vector) {
                    try { a.text.split('\n').forEach((l) => font.widthOfTextAtSize(l || ' ', 10)); } catch { vector = false; }
                }
                if (vector) {
                    const col = rgb(...hexToRgb01(a.color));
                    a.text.split('\n').forEach((line, idx) => {
                        if (!line) return;
                        page.drawText(line, { x: fx(a.x), y: fy(a.y + a.size * (0.94 + 1.2 * idx)), size: a.size, font, color: col });
                    });
                } else {
                    const r = await rasterText(a);
                    const img = await pdf.embedPng(r.bytes);
                    page.drawImage(img, { x: fx(a.x - r.pad), y: fy(a.y + r.m.h + r.pad), width: r.m.w + r.pad * 2, height: r.m.h + r.pad * 2 });
                }
            }
        }
        await tick();
    }
    o.onProgress(95, 'Saving...');
    return new Blob([(await pdf.save()) as any], { type: 'application/pdf' });
}