'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';
import Link from 'next/link';
import { LayoutGrid, ImagePlus, AlertCircle, RotateCw, RotateCcw, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import ToolSeoContent from '@/components/ToolSeoContent';
import { formatBytes } from '@/lib/pdf-utils';

type Mode = 'count' | 'grid' | 'size';
type Fit = 'contain' | 'cover' | 'stretch';
type Orient = 'auto' | 'portrait' | 'landscape';
type Format = 'pdf' | 'png' | 'jpg';

const UF = { mm: 1, cm: 10, in: 25.4 } as const;
type Unit = keyof typeof UF;

const PAGES = [
    { k: 'A4', label: 'A4 (210 × 297 mm)', w: 210, h: 297 },
    { k: 'A3', label: 'A3 (297 × 420 mm)', w: 297, h: 420 },
    { k: 'A5', label: 'A5 (148 × 210 mm)', w: 148, h: 210 },
    { k: 'A6', label: 'A6 (105 × 148 mm)', w: 105, h: 148 },
    { k: 'Letter', label: 'US Letter (8.5 × 11 in)', w: 215.9, h: 279.4 },
    { k: 'Legal', label: 'US Legal (8.5 × 14 in)', w: 215.9, h: 355.6 },
    { k: '4x6', label: 'Photo paper 4 × 6 in', w: 101.6, h: 152.4 },
    { k: '5x7', label: 'Photo paper 5 × 7 in', w: 127, h: 177.8 },
    { k: 'custom', label: 'Custom size', w: 0, h: 0 },
];

const PHOTO_PRESETS = [
    { k: 'passport', label: 'Passport / ID 35 × 45 mm', w: 35, h: 45 },
    { k: 'us2', label: 'US passport 2 × 2 in', w: 50.8, h: 50.8 },
    { k: 'small', label: 'Small ID 25 × 35 mm', w: 25, h: 35 },
    { k: 'stamp', label: 'Stamp 20 × 25 mm', w: 20, h: 25 },
    { k: 'wallet', label: 'Wallet 2.5 × 3.5 in', w: 63.5, h: 88.9 },
    { k: '4x6', label: 'Print 4 × 6 in', w: 101.6, h: 152.4 },
    { k: '5x7', label: 'Print 5 × 7 in', w: 127, h: 177.8 },
    { k: 'square', label: 'Square 50 × 50 mm', w: 50, h: 50 },
    { k: 'sticker', label: 'Sticker 40 × 40 mm', w: 40, h: 40 },
    { k: 'card', label: 'Business card 90 × 55 mm', w: 90, h: 55 },
    { k: 'id', label: 'ID card 85.6 × 54 mm', w: 85.6, h: 54 },
    { k: 'custom', label: 'Custom size', w: 0, h: 0 },
];

const COUNT_CHIPS = [1, 2, 4, 6, 8, 9, 12, 16, 20, 24, 30];
const tick = () => new Promise<void>((r) => setTimeout(r, 20));
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const mm2pt = (mm: number) => (mm * 72) / 25.4;

function hexRgb01(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h || '000000', 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* ---------- file loading ---------- */

const loadImg = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('image'));
        im.src = url;
    });

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), type, quality);
    });
}

async function renderSinglePagePdf(file: File): Promise<Blob> {
    const pdfjs: any = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
    const data = new Uint8Array(await file.arrayBuffer());
    const task: any = pdfjs.getDocument({ data });
    try {
        const doc: any = await task.promise;
        if (doc.numPages !== 1) {
            const err: any = new Error('pages');
            err.pages = doc.numPages;
            throw err;
        }
        const page = await doc.getPage(1);
        const v1 = page.getViewport({ scale: 1 });
        const scale = Math.max(1, Math.min(300 / 72, Math.sqrt(30_000_000 / (v1.width * v1.height))));
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;
        const blob = await canvasBlob(canvas, 'image/png');
        canvas.width = 0;
        canvas.height = 0;
        return blob;
    } finally {
        try { await task.destroy(); } catch { /* ignore */ }
    }
}

/* ---------- layout ---------- */

interface Layout {
    pw: number; ph: number; orient: 'portrait' | 'landscape';
    rows: number; cols: number; cw: number; ch: number; cellRot: boolean;
    perPage: number; used: number[]; xs: number[]; ys: number[];
}

interface LayoutIn {
    mode: Mode; count: number; rows: number; cols: number; sizeW: number; sizeH: number;
    total: number; allowRot: boolean; baseW: number; baseH: number; orient: Orient;
    margin: number; gap: number; align: 'center' | 'topleft'; sheets: number; ar: number;
}

type LayoutRes = { ok: true; L: Layout } | { ok: false; error: string };

function containArea(cw: number, ch: number, ar: number) {
    const wide = cw / ch > ar;
    const w = wide ? ch * ar : cw;
    const h = wide ? ch : cw / ar;
    return w * h;
}

function cellsFor(pw: number, ph: number, m: number, g: number, rows: number, cols: number) {
    const uw = pw - 2 * m - g * (cols - 1);
    const uh = ph - 2 * m - g * (rows - 1);
    if (uw <= 0.5 || uh <= 0.5) return null;
    return { cw: uw / cols, ch: uh / rows };
}

function computeLayout(i: LayoutIn): LayoutRes {
    const s = Math.min(i.baseW, i.baseH);
    const l = Math.max(i.baseW, i.baseH);
    if (s < 20) return { ok: false, error: 'The page is too small. Enter a size of at least 20 mm.' };
    const orients = (i.orient === 'auto' ? ['portrait', 'landscape'] : [i.orient]) as ('portrait' | 'landscape')[];
    const dims = (o: 'portrait' | 'landscape'): [number, number] => (o === 'portrait' ? [s, l] : [l, s]);

    if (i.mode !== 'size') {
        const N = i.mode === 'count' ? i.count : i.rows * i.cols;
        if (!(N >= 1) || N > 200) return { ok: false, error: 'Choose between 1 and 200 copies per sheet.' };
        let best: any = null;
        for (const o of orients) {
            const [pw, ph] = dims(o);
            const cands: [number, number][] = [];
            if (i.mode === 'count') {
                for (let r = 1; r <= N; r++) cands.push([r, Math.ceil(N / r)]);
                for (let c = 1; c <= N; c++) cands.push([Math.ceil(N / c), c]);
            } else cands.push([i.rows, i.cols]);
            for (const [r, c] of cands) {
                const cell = cellsFor(pw, ph, i.margin, i.gap, r, c);
                if (!cell) continue;
                const score = containArea(cell.cw, cell.ch, i.ar) * (1 - (r * c - N) * 0.0005);
                if (!best || score > best.score) best = { score, o, pw, ph, r, c, ...cell };
            }
        }
        if (!best) return { ok: false, error: 'The margins and gaps leave no room on this page. Reduce them or use a bigger page.' };
        const xs = Array.from({ length: best.c }, (_, k) => i.margin + k * (best.cw + i.gap));
        const ys = Array.from({ length: best.r }, (_, k) => i.margin + k * (best.ch + i.gap));
        const sheets = clamp(Math.round(i.sheets) || 1, 1, 100);
        return {
            ok: true,
            L: {
                pw: best.pw, ph: best.ph, orient: best.o, rows: best.r, cols: best.c, cw: best.cw, ch: best.ch,
                cellRot: false, perPage: N, used: Array(sheets).fill(N), xs, ys,
            },
        };
    }

    if (!(i.sizeW > 0) || !(i.sizeH > 0)) return { ok: false, error: 'Enter a photo width and height.' };
    let best: any = null;
    for (const o of orients) {
        const [pw, ph] = dims(o);
        const uw = pw - 2 * i.margin;
        const uh = ph - 2 * i.margin;
        for (const rot of i.allowRot ? [false, true] : [false]) {
            const w = rot ? i.sizeH : i.sizeW;
            const h = rot ? i.sizeW : i.sizeH;
            const cols = Math.floor((uw + i.gap + 1e-6) / (w + i.gap));
            const rows = Math.floor((uh + i.gap + 1e-6) / (h + i.gap));
            const n = cols * rows;
            if (n > 0 && (!best || n > best.n)) best = { n, o, pw, ph, cols, rows, w, h, rot };
        }
    }
    if (!best) return { ok: false, error: 'The photo is larger than the printable area. Use a bigger page, smaller photo or smaller margins.' };

    let used: number[];
    if (i.total > 0) {
        const pages = Math.ceil(i.total / best.n);
        if (pages > 100) return { ok: false, error: 'That would need more than 100 sheets. Lower the number of copies.' };
        used = Array.from({ length: pages }, (_, p) => Math.min(best.n, i.total - p * best.n));
    } else {
        used = Array(clamp(Math.round(i.sheets) || 1, 1, 100)).fill(best.n);
    }
    const bw = best.cols * best.w + (best.cols - 1) * i.gap;
    const bh = best.rows * best.h + (best.rows - 1) * i.gap;
    const x0 = i.align === 'center' ? (best.pw - bw) / 2 : i.margin;
    const y0 = i.align === 'center' ? (best.ph - bh) / 2 : i.margin;
    return {
        ok: true,
        L: {
            pw: best.pw, ph: best.ph, orient: best.o, rows: best.rows, cols: best.cols, cw: best.w, ch: best.h,
            cellRot: best.rot, perPage: best.n, used,
            xs: Array.from({ length: best.cols }, (_, k) => x0 + k * (best.w + i.gap)),
            ys: Array.from({ length: best.rows }, (_, k) => y0 + k * (best.h + i.gap)),
        },
    };
}

/* ---------- drawing ---------- */

interface RenderOpts { fit: Fit; rot: number; bg: string; cut: boolean; dashed: boolean; cutColor: string }

function drawFit(
    ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number,
    fit: Fit, rot: number, bg: string
) {
    const sideways = rot % 180 !== 0;
    const rw = sideways ? img.naturalHeight : img.naturalWidth;
    const rh = sideways ? img.naturalWidth : img.naturalHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    let dw = w;
    let dh = h;
    if (fit !== 'stretch') {
        const s = fit === 'cover' ? Math.max(w / rw, h / rh) : Math.min(w / rw, h / rh);
        dw = rw * s;
        dh = rh * s;
    }
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rot * Math.PI) / 180);
    const iw = sideways ? dh : dw;
    const ih = sideways ? dw : dh;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    ctx.restore();
}

function drawSheet(
    ctx: CanvasRenderingContext2D, k: number, L: Layout, page: number, img: HTMLImageElement, o: RenderOpts
) {
    ctx.fillStyle = o.bg;
    ctx.fillRect(0, 0, L.pw * k, L.ph * k);
    const n = L.used[page] ?? 0;
    for (let i = 0; i < n; i++) {
        const r = Math.floor(i / L.cols);
        const c = i % L.cols;
        drawFit(ctx, img, L.xs[c] * k, L.ys[r] * k, L.cw * k, L.ch * k, o.fit, o.rot, o.bg);
    }
    if (o.cut) {
        ctx.save();
        ctx.strokeStyle = o.cutColor;
        ctx.lineWidth = Math.max(1, 0.25 * k);
        if (o.dashed) ctx.setLineDash([2 * k, 1.5 * k]);
        for (let i = 0; i < n; i++) {
            const r = Math.floor(i / L.cols);
            const c = i % L.cols;
            ctx.strokeRect(L.xs[c] * k, L.ys[r] * k, L.cw * k, L.ch * k);
        }
        ctx.restore();
    }
}

async function buildImage(
    img: HTMLImageElement, L: Layout, o: RenderOpts, dpi: number, type: 'image/png' | 'image/jpeg'
) {
    const k = dpi / 25.4;
    const w = Math.round(L.pw * k);
    const h = Math.round(L.ph * k);
    if (w * h > 64_000_000) throw new Error('too-large');
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    drawSheet(ctx, k, L, 0, img, o);
    const blob = await canvasBlob(c, type, 0.95);
    c.width = 0;
    c.height = 0;
    return blob;
}

async function buildPdf(
    img: HTMLImageElement, L: Layout, o: RenderOpts, dpi: number, onProgress: (p: number) => void
) {
    const { PDFDocument, rgb } = (await import('pdf-lib')) as any;
    const pdf = await PDFDocument.create();
    const k = dpi / 25.4;
    const cwPx = clamp(Math.round(L.cw * k), 1, 5000);
    const chPx = clamp(Math.round(L.ch * k), 1, 5000);
    const cell = document.createElement('canvas');
    cell.width = cwPx;
    cell.height = chPx;
    const cctx = cell.getContext('2d');
    if (!cctx) throw new Error('Canvas not supported');
    drawFit(cctx, img, 0, 0, cwPx, chPx, o.fit, o.rot, o.bg);
    const jpg = await canvasBlob(cell, 'image/jpeg', 0.95);
    cell.width = 0;
    cell.height = 0;
    const embedded = await pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));

    const pageW = mm2pt(L.pw);
    const pageH = mm2pt(L.ph);
    const cutCol = rgb(...hexRgb01(o.cutColor));
    for (let p = 0; p < L.used.length; p++) {
        const page = pdf.addPage([pageW, pageH]);
        if (o.bg.toLowerCase() !== '#ffffff') {
            page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: rgb(...hexRgb01(o.bg)) });
        }
        for (let i = 0; i < L.used[p]; i++) {
            const r = Math.floor(i / L.cols);
            const c = i % L.cols;
            const x = mm2pt(L.xs[c]);
            const y = pageH - mm2pt(L.ys[r] + L.ch);
            page.drawImage(embedded, { x, y, width: mm2pt(L.cw), height: mm2pt(L.ch) });
            if (o.cut) {
                const opts: any = { x, y, width: mm2pt(L.cw), height: mm2pt(L.ch), borderColor: cutCol, borderWidth: 0.7 };
                if (o.dashed) opts.borderDashArray = [4, 3];
                page.drawRectangle(opts);
            }
        }
        onProgress(((p + 1) / L.used.length) * 90);
        await tick();
    }
    const bytes = await pdf.save();
    return new Blob([bytes as any], { type: 'application/pdf' });
}

/* ---------- small UI helpers ---------- */

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
            {children}
            {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
        </label>
    );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500';
const cardCls = 'p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3';

/* ---------- page ---------- */

export default function ImageSheetPage() {
    const [file, setFile] = useState<File | null>(null);
    const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
    const [fromPdf, setFromPdf] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<{ msg: string; split?: boolean } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const urlRef = useRef<string | null>(null);

    const [mode, setMode] = useState<Mode>('count');
    const [count, setCount] = useState(4);
    const [rows, setRows] = useState(2);
    const [cols, setCols] = useState(2);
    const [photoPreset, setPhotoPreset] = useState('passport');
    const [unit, setUnit] = useState<Unit>('mm');
    const [sizeW, setSizeW] = useState(35);
    const [sizeH, setSizeH] = useState(45);
    const [total, setTotal] = useState(0);
    const [allowRot, setAllowRot] = useState(true);

    const [pagePreset, setPagePreset] = useState('A4');
    const [customW, setCustomW] = useState(210);
    const [customH, setCustomH] = useState(297);
    const [orient, setOrient] = useState<Orient>('auto');
    const [margin, setMargin] = useState(10);
    const [gap, setGap] = useState(5);
    const [align, setAlign] = useState<'center' | 'topleft'>('center');
    const [sheets, setSheets] = useState(1);

    const [fit, setFit] = useState<Fit>('contain');
    const [rot, setRot] = useState(0);
    const [bg, setBg] = useState('#ffffff');
    const [cut, setCut] = useState(true);
    const [dashed, setDashed] = useState(false);
    const [cutColor, setCutColor] = useState('#9ca3af');

    const [format, setFormat] = useState<Format>('pdf');
    const [dpi, setDpi] = useState(300);
    const [outName, setOutName] = useState('image-sheet');
    const [sheetIdx, setSheetIdx] = useState(0);

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cancelRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const f = UF[unit];

    useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

    const loadFile = async (files: FileList | File[] | null) => {
        const picked = files && files[0];
        if (!picked) return;
        const isPdf = picked.type === 'application/pdf' || /\.pdf$/i.test(picked.name);
        if (!isPdf && !picked.type.startsWith('image/')) {
            setLoadError({ msg: 'Please choose an image (JPG, PNG, WebP) or a single-page PDF.' });
            return;
        }
        setLoadError(null);
        setLoading(true);
        try {
            let url: string;
            if (isPdf) {
                const blob = await renderSinglePagePdf(picked);
                url = URL.createObjectURL(blob);
            } else {
                url = URL.createObjectURL(picked);
            }
            let im: HTMLImageElement;
            try {
                im = await loadImg(url);
            } catch (e) {
                URL.revokeObjectURL(url);
                throw e;
            }
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
            urlRef.current = url;
            setFile(picked);
            setImgEl(im);
            setFromPdf(isPdf);
            setRot(0);
            setSheetIdx(0);
            setOutName(picked.name.replace(/\.[^.]+$/, '') + '-sheet');
        } catch (e: any) {
            if (e?.message === 'pages') {
                setLoadError({
                    msg: `This PDF has ${e.pages} pages. Only single-page PDFs are accepted here. Use Split PDF to extract the page you need, then upload that file.`,
                    split: true,
                });
            } else if (e?.name === 'PasswordException') {
                setLoadError({ msg: 'This PDF is password protected. Remove the password in the program that created it and try again.' });
            } else if (e?.message === 'image') {
                setLoadError({ msg: 'This image could not be opened. HEIC files are not supported by most browsers, so convert it to JPG or PNG first.' });
            } else {
                setLoadError({ msg: 'This file could not be read. It may be damaged. Try another file.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        loadFile(e.dataTransfer.files);
    };

    const changeUnit = (u: Unit) => {
        const ratio = UF[unit] / UF[u];
        setSizeW((v) => round2(v * ratio));
        setSizeH((v) => round2(v * ratio));
        setMargin((v) => round2(v * ratio));
        setGap((v) => round2(v * ratio));
        setCustomW((v) => round2(v * ratio));
        setCustomH((v) => round2(v * ratio));
        setUnit(u);
    };

    const pickPhotoPreset = (k: string) => {
        setPhotoPreset(k);
        const p = PHOTO_PRESETS.find((x) => x.k === k);
        if (p && p.w > 0) {
            setSizeW(round2(p.w / f));
            setSizeH(round2(p.h / f));
        }
    };

    const basePage = useMemo(() => {
        const p = PAGES.find((x) => x.k === pagePreset);
        if (!p || p.k === 'custom') return { w: customW * f, h: customH * f };
        return { w: p.w, h: p.h };
    }, [pagePreset, customW, customH, f]);

    const sideways = rot % 180 !== 0;
    const ar = imgEl ? (sideways ? imgEl.naturalHeight / imgEl.naturalWidth : imgEl.naturalWidth / imgEl.naturalHeight) : 1;

    const layoutRes: LayoutRes = useMemo(
        () => computeLayout({
            mode, count, rows, cols, sizeW: sizeW * f, sizeH: sizeH * f, total, allowRot,
            baseW: basePage.w, baseH: basePage.h, orient, margin: margin * f, gap: gap * f, align, sheets, ar,
        }),
        [mode, count, rows, cols, sizeW, sizeH, total, allowRot, basePage, orient, margin, gap, align, sheets, ar, f]
    );

    const L = layoutRes.ok ? layoutRes.L : null;
    const totalRot = (rot + (L?.cellRot ? 90 : 0)) % 360;
    const renderOpts: RenderOpts = { fit, rot: totalRot, bg, cut, dashed, cutColor };
    const pageCount = L ? L.used.length : 1;
    const shownSheet = Math.min(sheetIdx, Math.max(0, pageCount - 1));

    useEffect(() => {
        const c = canvasRef.current;
        if (!c || !imgEl || !L) return;
        const W = 900;
        const k = W / L.pw;
        c.width = W;
        c.height = Math.round(L.ph * k);
        const ctx = c.getContext('2d');
        if (!ctx) return;
        drawSheet(ctx, k, L, shownSheet, imgEl, { fit, rot: totalRot, bg, cut, dashed, cutColor });
    }, [imgEl, L, shownSheet, fit, totalRot, bg, cut, dashed, cutColor]);

    const effDpi = useMemo(() => {
        if (!imgEl || !L) return null;
        const sw = totalRot % 180 !== 0 ? imgEl.naturalHeight : imgEl.naturalWidth;
        const sh = totalRot % 180 !== 0 ? imgEl.naturalWidth : imgEl.naturalHeight;
        const sx = L.cw / sw;
        const sy = L.ch / sh;
        const mmPerPx = fit === 'cover' ? Math.max(sx, sy) : fit === 'stretch' ? Math.max(sx, sy) : Math.min(sx, sy);
        return Math.round(25.4 / mmPerPx);
    }, [imgEl, L, totalRot, fit]);

    const totalCopies = L ? L.used.reduce((s, n) => s + n, 0) : 0;

    const handleCreate = async () => {
        if (!imgEl || !L) return;
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(5);
        setMessage('Building your sheet...');
        setStatus('processing');
        await tick();
        try {
            let blob: Blob;
            if (format === 'pdf') {
                blob = await buildPdf(imgEl, L, renderOpts, dpi, (p) => setProgress(p));
            } else {
                blob = await buildImage(imgEl, L, renderOpts, dpi, format === 'png' ? 'image/png' : 'image/jpeg');
            }
            if (cancelRef.current) return;
            setResult(blob);
            setProgress(100);
            await new Promise((r) => setTimeout(r, 300));
            setStatus('done');
        } catch (e: any) {
            console.error(e);
            setModalError(e?.message === 'too-large'
                ? 'The image would be too large at this DPI. Choose a lower DPI.'
                : 'Failed to create the sheet. Try a lower DPI or a smaller image.');
            setStatus('error');
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus('idle'); setProgress(0); };
    const closeModal = () => { setStatus('idle'); setModalError(null); };
    const resetAll = () => {
        if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
        setFile(null);
        setImgEl(null);
        setFromPdf(false);
        setResult(null);
        setStatus('idle');
        setProgress(0);
    };

    const safeName = (outName.trim() || 'image-sheet').replace(/[\\/:*?"<>|]/g, '_');
    const ext = format === 'pdf' ? 'pdf' : format;
    const tabCls = (on: boolean) =>
        `px-3 py-2 text-sm font-semibold rounded-lg border ${on ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`;
    const chipCls = (on: boolean) =>
        `px-3 py-1.5 text-sm rounded-full border ${on ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`;

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-3 sm:px-6">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl mb-4">
                        <LayoutGrid className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Image Sheet Maker</h1>
                    <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                        Upload one image or a single-page PDF and repeat it on a page: 2, 4, 8 or any number of copies, a custom grid, or a fixed photo size such as a passport photo. Save as PDF, PNG or JPG. Your file never leaves your browser.
                    </p>
                </div>

                {!imgEl ? (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => !loading && inputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition ${dragOver ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                        <ImagePlus className="w-10 h-10 text-cyan-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-800">
                            {loading ? 'Reading your file...' : 'Click to choose a file, or drop it here'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Image (JPG, PNG, WebP, GIF, BMP, AVIF) or a PDF with one page</p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*,application/pdf,.pdf"
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => { loadFile(e.target.files); e.target.value = ''; }}
                        />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{file?.name}</p>
                                <p className="text-xs text-cyan-700 font-medium">
                                    {fromPdf && <span className="mr-2 px-1.5 py-0.5 rounded bg-cyan-600 text-white">PDF page</span>}
                                    {imgEl.naturalWidth} × {imgEl.naturalHeight} px · {file ? formatBytes(file.size) : ''}
                                </p>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-600 hover:underline font-medium shrink-0">Change file</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <section className={cardCls}>
                                    <h2 className="text-sm font-bold text-gray-800">Layout</h2>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" className={tabCls(mode === 'count')} onClick={() => setMode('count')}>Copies per sheet</button>
                                        <button type="button" className={tabCls(mode === 'grid')} onClick={() => setMode('grid')}>Custom grid</button>
                                        <button type="button" className={tabCls(mode === 'size')} onClick={() => setMode('size')}>Fixed photo size</button>
                                    </div>

                                    {mode === 'count' && (
                                        <>
                                            <div className="flex flex-wrap gap-2">
                                                {COUNT_CHIPS.map((n) => (
                                                    <button key={n} type="button" className={chipCls(count === n)} onClick={() => setCount(n)}>{n}</button>
                                                ))}
                                            </div>
                                            <Field label="Or enter any number (1 to 200)">
                                                <input type="number" min={1} max={200} className={inputCls} value={count}
                                                    onChange={(e) => setCount(clamp(Math.round(Number(e.target.value)) || 1, 1, 200))} />
                                            </Field>
                                            <p className="text-xs text-gray-500">The tool picks the rows and columns that give the largest pictures.</p>
                                        </>
                                    )}

                                    {mode === 'grid' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Rows">
                                                <input type="number" min={1} max={20} className={inputCls} value={rows}
                                                    onChange={(e) => setRows(clamp(Math.round(Number(e.target.value)) || 1, 1, 20))} />
                                            </Field>
                                            <Field label="Columns">
                                                <input type="number" min={1} max={20} className={inputCls} value={cols}
                                                    onChange={(e) => setCols(clamp(Math.round(Number(e.target.value)) || 1, 1, 20))} />
                                            </Field>
                                        </div>
                                    )}

                                    {mode === 'size' && (
                                        <>
                                            <Field label="Photo size">
                                                <select className={inputCls} value={photoPreset} onChange={(e) => pickPhotoPreset(e.target.value)}>
                                                    {PHOTO_PRESETS.map((p) => <option key={p.k} value={p.k}>{p.label}</option>)}
                                                </select>
                                            </Field>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label={`Width (${unit})`}>
                                                    <input type="number" min={1} step="0.1" className={inputCls} value={sizeW}
                                                        onChange={(e) => { setPhotoPreset('custom'); setSizeW(Number(e.target.value) || 0); }} />
                                                </Field>
                                                <Field label={`Height (${unit})`}>
                                                    <input type="number" min={1} step="0.1" className={inputCls} value={sizeH}
                                                        onChange={(e) => { setPhotoPreset('custom'); setSizeH(Number(e.target.value) || 0); }} />
                                                </Field>
                                            </div>
                                            <Field label="Number of copies" hint="Leave at 0 to fill the whole page. A bigger number makes extra sheets.">
                                                <input type="number" min={0} max={2000} className={inputCls} value={total}
                                                    onChange={(e) => setTotal(clamp(Math.round(Number(e.target.value)) || 0, 0, 2000))} />
                                            </Field>
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input type="checkbox" checked={allowRot} onChange={(e) => setAllowRot(e.target.checked)} className="accent-cyan-600" />
                                                Rotate photos 90° if that fits more on the page
                                            </label>
                                        </>
                                    )}

                                    {(mode !== 'size' || total === 0) && (
                                        <Field label="Number of identical sheets">
                                            <input type="number" min={1} max={100} className={inputCls} value={sheets}
                                                onChange={(e) => setSheets(clamp(Math.round(Number(e.target.value)) || 1, 1, 100))} />
                                        </Field>
                                    )}
                                </section>

                                <section className={cardCls}>
                                    <h2 className="text-sm font-bold text-gray-800">Page and spacing</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Paper size">
                                            <select className={inputCls} value={pagePreset} onChange={(e) => setPagePreset(e.target.value)}>
                                                {PAGES.map((p) => <option key={p.k} value={p.k}>{p.label}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Units">
                                            <select className={inputCls} value={unit} onChange={(e) => changeUnit(e.target.value as Unit)}>
                                                <option value="mm">Millimetres</option>
                                                <option value="cm">Centimetres</option>
                                                <option value="in">Inches</option>
                                            </select>
                                        </Field>
                                    </div>
                                    {pagePreset === 'custom' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label={`Page width (${unit})`}>
                                                <input type="number" min={1} step="0.1" className={inputCls} value={customW} onChange={(e) => setCustomW(Number(e.target.value) || 0)} />
                                            </Field>
                                            <Field label={`Page height (${unit})`}>
                                                <input type="number" min={1} step="0.1" className={inputCls} value={customH} onChange={(e) => setCustomH(Number(e.target.value) || 0)} />
                                            </Field>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Orientation">
                                            <select className={inputCls} value={orient} onChange={(e) => setOrient(e.target.value as Orient)}>
                                                <option value="auto">Automatic (best fit)</option>
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </Field>
                                        {mode === 'size' ? (
                                            <Field label="Position">
                                                <select className={inputCls} value={align} onChange={(e) => setAlign(e.target.value as 'center' | 'topleft')}>
                                                    <option value="center">Centered</option>
                                                    <option value="topleft">Top left</option>
                                                </select>
                                            </Field>
                                        ) : <div />}
                                        <Field label={`Margin (${unit})`}>
                                            <input type="number" min={0} step="0.5" className={inputCls} value={margin} onChange={(e) => setMargin(Math.max(0, Number(e.target.value) || 0))} />
                                        </Field>
                                        <Field label={`Gap between copies (${unit})`}>
                                            <input type="number" min={0} step="0.5" className={inputCls} value={gap} onChange={(e) => setGap(Math.max(0, Number(e.target.value) || 0))} />
                                        </Field>
                                    </div>
                                </section>

                                <section className={cardCls}>
                                    <h2 className="text-sm font-bold text-gray-800">Image and cut lines</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Fit in each box">
                                            <select className={inputCls} value={fit} onChange={(e) => setFit(e.target.value as Fit)}>
                                                <option value="contain">Whole image (no cropping)</option>
                                                <option value="cover">Fill the box (crop edges)</option>
                                                <option value="stretch">Stretch to the box</option>
                                            </select>
                                        </Field>
                                        <Field label="Background">
                                            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-white" />
                                        </Field>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setRot((r) => (r + 270) % 360)} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100">
                                            <RotateCcw className="w-4 h-4" /> Rotate left
                                        </button>
                                        <button type="button" onClick={() => setRot((r) => (r + 90) % 360)} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100">
                                            <RotateCw className="w-4 h-4" /> Rotate right
                                        </button>
                                        <span className="text-xs text-gray-500">{rot}°</span>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={cut} onChange={(e) => setCut(e.target.checked)} className="accent-cyan-600" />
                                        Draw cut lines around each copy
                                    </label>
                                    {cut && (
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input type="checkbox" checked={dashed} onChange={(e) => setDashed(e.target.checked)} className="accent-cyan-600" />
                                                Dashed
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                Color <input type="color" value={cutColor} onChange={(e) => setCutColor(e.target.value)} />
                                            </label>
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="lg:col-span-3 space-y-4">
                                <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4">
                                    {L ? (
                                        <>
                                            <div className="mx-auto shadow-md bg-white" style={{ maxWidth: 560 }}>
                                                <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                            </div>
                                            {pageCount > 1 && (
                                                <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-700">
                                                    <button type="button" className="p-1.5 rounded-lg border bg-white disabled:opacity-40" disabled={shownSheet === 0} onClick={() => setSheetIdx(shownSheet - 1)}><ChevronLeft className="w-4 h-4" /></button>
                                                    Sheet {shownSheet + 1} of {pageCount}
                                                    <button type="button" className="p-1.5 rounded-lg border bg-white disabled:opacity-40" disabled={shownSheet >= pageCount - 1} onClick={() => setSheetIdx(shownSheet + 1)}><ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <span>{!layoutRes.ok ? layoutRes.error : ''}</span>
                                        </div>
                                    )}
                                </div>

                                {L && (
                                    <div className="text-sm text-gray-700 space-y-1 p-4 rounded-2xl border border-gray-200">
                                        <p>
                                            <b>{L.perPage}</b> per sheet ({L.cols} × {L.rows}), <b>{totalCopies}</b> in total on {pageCount} {pageCount === 1 ? 'sheet' : 'sheets'}.
                                            Each box is {round2(L.cw / f)} × {round2(L.ch / f)} {unit}, {L.orient}.
                                        </p>
                                        {effDpi !== null && (
                                            <p className={effDpi < 150 ? 'text-amber-700 flex items-start gap-1' : 'text-gray-500 flex items-start gap-1'}>
                                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>
                                                    Print resolution about {effDpi} DPI.
                                                    {effDpi < 150 ? ' This image may look blurry at this size. Use a larger original or fewer, smaller copies.' : ' This is good for printing.'}
                                                    {fromPdf && ' The PDF page was drawn as a picture at up to 300 DPI of its original size.'}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <section className={cardCls}>
                                    <h2 className="text-sm font-bold text-gray-800">Save</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Field label="Format">
                                            <select className={inputCls} value={format} onChange={(e) => setFormat(e.target.value as Format)}>
                                                <option value="pdf">PDF (all sheets)</option>
                                                <option value="png">PNG (first sheet)</option>
                                                <option value="jpg">JPG (first sheet)</option>
                                            </select>
                                        </Field>
                                        <Field label="Resolution">
                                            <select className={inputCls} value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
                                                <option value={150}>150 DPI (small file)</option>
                                                <option value={200}>200 DPI</option>
                                                <option value={300}>300 DPI (print)</option>
                                                <option value={600}>600 DPI (very large)</option>
                                            </select>
                                        </Field>
                                        <Field label="File name">
                                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                                                <input value={outName} onChange={(e) => setOutName(e.target.value)} className="flex-1 min-w-0 px-3 py-2 text-sm focus:outline-none" />
                                                <span className="px-2 text-xs text-gray-500 bg-gray-50 py-2.5">.{ext}</span>
                                            </div>
                                        </Field>
                                    </div>
                                    {format !== 'pdf' && pageCount > 1 && (
                                        <p className="text-xs text-amber-700">PNG and JPG save the first sheet only. Choose PDF to get every sheet.</p>
                                    )}
                                    <p className="text-xs text-gray-500">When printing, choose Actual size or 100% so the copies keep their exact size.</p>
                                    <ProcessButton
                                        onClick={handleCreate}
                                        loading={status === 'processing'}
                                        disabled={!L}
                                        label={`Create ${ext.toUpperCase()}`}
                                        loadingLabel="Creating..."
                                    />
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {loadError && (
                    <div className="mt-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>
                            {loadError.msg}
                            {loadError.split && (
                                <> <Link href="/split-pdf" className="underline font-semibold">Open Split PDF</Link></>
                            )}
                        </span>
                    </div>
                )}
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Creating your sheet"
                message={message}
                blob={result}
                filename={`${safeName}.${ext}`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />

            <ToolSeoContent
                id="image-sheet"
                steps={[
                    'Choose the image, or a PDF with a single page, that you want to repeat.',
                    'Pick a layout: copies per sheet, a custom grid, or a fixed photo size such as a passport photo.',
                    'Set the paper size, margin, gap, fit and cut lines, and check the live preview.',
                    'Choose PDF, PNG or JPG and click Create. Print at Actual size.',
                ]}
            />
        </main>
    );
}