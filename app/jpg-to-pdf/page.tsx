'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
    ImageIcon, Trash2, ArrowUp, ArrowDown, GripVertical, RotateCcw, RotateCw,
    Copy, ArrowDownAZ, ArrowUpZA, AlertCircle, CheckCircle2,
} from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import { uid, formatBytes, bytesToBlob } from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

interface ImgItem {
    id: string;
    file: File;
    url: string;
    width: number;
    height: number;
    rotation: 0 | 90 | 180 | 270;
}

type PageSize = 'fit' | 'a4' | 'letter' | 'legal';
type Orientation = 'auto' | 'portrait' | 'landscape';
type Fit = 'contain' | 'cover';
type Quality = 'original' | 'high' | 'medium' | 'low' | 'target';

type Prepared = {
    kind: 'jpg' | 'png';
    bytes: Uint8Array | ArrayBuffer;
    byteLength: number;
    pw: number;
    ph: number;
    dw: number;
    dh: number;
};

type ResultInfo = {
    inputBytes: number;
    outputBytes: number;
    targetBytes: number; // 0 = no target
    hitTarget: boolean;
    passes: number;
};

const MAX_IMAGES = 100;
const TARGET_DPI = 220; // max effective resolution on the page in target mode
const MAX_PASSES = 4;

const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
};
const MARGINS: Record<string, number> = { none: 0, small: 20, medium: 40, large: 70 };

const PRESETS: Record<'high' | 'medium' | 'low', { q: number; maxSide: number }> = {
    high: { q: 0.9, maxSide: 3500 },
    medium: { q: 0.72, maxSide: 2400 },
    low: { q: 0.5, maxSide: 1600 },
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif';

// Resolution steps and JPEG quality range used by the size-fitting search.
const SCALES = [1, 0.82, 0.67, 0.55, 0.45, 0.36, 0.3, 0.24, 0.18];
const Q_MAX = 0.88;
const Q_MIN = 0.35;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = url;
    });
}

function canvasToBytes(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            async (blob) => {
                if (!blob) return reject(new Error('Canvas export failed'));
                resolve(new Uint8Array(await blob.arrayBuffer()));
            },
            type,
            quality
        );
    });
}

function applyGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const y = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
        d[i] = d[i + 1] = d[i + 2] = y;
    }
    ctx.putImageData(img, 0, 0);
}

/** Draw the (rotated) image into a canvas of exactly w x h pixels (w,h are the final, rotated size). */
function renderCanvas(
    img: HTMLImageElement,
    rotation: number,
    w: number,
    h: number,
    gray: boolean,
    keepAlpha: boolean
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    if (!keepAlpha) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const swap = rotation === 90 || rotation === 270;
    const dw = swap ? h : w;
    const dh = swap ? w : h;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (gray) applyGrayscale(ctx, w, h);
    return canvas;
}

/**
 * Finds the best-looking JPEG that fits the byte budget:
 * 1) try high quality, 2) binary-search quality, 3) step resolution down if needed.
 */
async function encodeToBudget(
    img: HTMLImageElement,
    rotation: number,
    w0: number,
    h0: number,
    budget: number,
    gray: boolean
): Promise<Uint8Array> {
    let last: Uint8Array | null = null;

    for (const s of SCALES) {
        const w = Math.max(16, Math.round(w0 * s));
        const h = Math.max(16, Math.round(h0 * s));
        const canvas = renderCanvas(img, rotation, w, h, gray, false);

        const top = await canvasToBytes(canvas, 'image/jpeg', Q_MAX);
        if (top.length <= budget) {
            canvas.width = canvas.height = 0;
            return top;
        }

        const bottom = await canvasToBytes(canvas, 'image/jpeg', Q_MIN);
        last = bottom;
        if (bottom.length <= budget) {
            let lo = Q_MIN;
            let hi = Q_MAX;
            let best = bottom;
            for (let i = 0; i < 6; i++) {
                const mid = (lo + hi) / 2;
                const b = await canvasToBytes(canvas, 'image/jpeg', mid);
                if (b.length <= budget) {
                    best = b;
                    lo = mid;
                } else {
                    hi = mid;
                }
            }
            canvas.width = canvas.height = 0;
            return best;
        }
        canvas.width = canvas.height = 0;
    }
    return last!;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function JpgToPdfPage() {
    const [items, setItems] = useState<ImgItem[]>([]);
    const [pageSize, setPageSize] = useState<PageSize>('a4');
    const [orientation, setOrientation] = useState<Orientation>('auto');
    const [margin, setMargin] = useState<string>('small');
    const [fit, setFit] = useState<Fit>('contain');
    const [quality, setQuality] = useState<Quality>('target');
    const [targetMB, setTargetMB] = useState<string>('15');
    const [grayscale, setGrayscale] = useState(false);
    const [outName, setOutName] = useState('images');
    const [dragId, setDragId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [resultInfo, setResultInfo] = useState<ResultInfo | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const cancelRef = useRef(false);
    const urlsRef = useRef<string[]>([]);

    useEffect(() => {
        return () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
    }, []);

    const targetNum = parseFloat(targetMB);
    const targetValid = Number.isFinite(targetNum) && targetNum >= 0.1 && targetNum <= 500;
    const targetBytes = quality === 'target' && targetValid ? Math.round(targetNum * 1024 * 1024) : 0;
    const atLimit = items.length >= MAX_IMAGES;

    /* ---------- list management ---------- */

    const addFiles = async (files: File[]) => {
        setPageError(null);
        const room = MAX_IMAGES - items.length;
        if (room <= 0) {
            setPageError(`You can add up to ${MAX_IMAGES} images at a time.`);
            return;
        }

        const accepted = files.slice(0, room);
        const skipped = files.length - accepted.length;
        const added: ImgItem[] = [];
        const failed: string[] = [];

        for (const file of accepted) {
            const url = URL.createObjectURL(file);
            try {
                const img = await loadImage(url);
                urlsRef.current.push(url);
                added.push({
                    id: uid(), file, url,
                    width: img.naturalWidth, height: img.naturalHeight, rotation: 0,
                });
            } catch {
                URL.revokeObjectURL(url);
                failed.push(file.name);
            }
        }

        setItems((prev) => [...prev, ...added].slice(0, MAX_IMAGES));

        const msgs: string[] = [];
        if (skipped > 0) {
            msgs.push(`Maximum is ${MAX_IMAGES} images, so ${skipped} file${skipped > 1 ? 's were' : ' was'} not added.`);
        }
        if (failed.length > 0) {
            msgs.push(`Could not read as an image: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? ` and ${failed.length - 3} more` : ''}.`);
        }
        if (msgs.length) setPageError(msgs.join(' '));
    };

    const patch = (id: string, p: Partial<ImgItem>) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

    const rotate = (it: ImgItem, dir: 1 | -1) =>
        patch(it.id, { rotation: ((it.rotation + dir * 90 + 360) % 360) as ImgItem['rotation'] });

    const remove = (id: string) => {
        setPageError(null);
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const duplicate = (index: number) => {
        if (items.length >= MAX_IMAGES) {
            setPageError(`You can add up to ${MAX_IMAGES} images at a time.`);
            return;
        }
        setItems((prev) => {
            if (prev.length >= MAX_IMAGES) return prev;
            const next = [...prev];
            next.splice(index + 1, 0, { ...prev[index], id: uid() });
            return next;
        });
    };

    const move = (index: number, dir: -1 | 1) =>
        setItems((prev) => {
            const t = index + dir;
            if (t < 0 || t >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[t]] = [next[t], next[index]];
            return next;
        });

    const sortBy = (dir: 'asc' | 'desc') =>
        setItems((prev) => [...prev].sort((a, b) =>
            dir === 'asc'
                ? a.file.name.localeCompare(b.file.name, undefined, { numeric: true })
                : b.file.name.localeCompare(a.file.name, undefined, { numeric: true })
        ));

    const onDrop = (targetId: string) => {
        if (!dragId || dragId === targetId) return;
        setItems((prev) => {
            const from = prev.findIndex((i) => i.id === dragId);
            const to = prev.findIndex((i) => i.id === targetId);
            if (from < 0 || to < 0) return prev;
            const next = [...prev];
            const [m] = next.splice(from, 1);
            next.splice(to, 0, m);
            return next;
        });
        setDragId(null);
        setOverId(null);
    };

    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const resetAll = () => {
        urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
        urlsRef.current = [];
        setItems([]);
        setResult(null);
        setResultInfo(null);
        setStatus('idle');
        setProgress(0);
        setOutName('images');
        setPageError(null);
    };

    const totalSize = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items]);

    /* ---------- layout ---------- */

    const layout = (iw: number, ih: number) => {
        const m = MARGINS[margin] ?? 0;
        let pw: number;
        let ph: number;
        if (pageSize === 'fit') {
            pw = iw + m * 2;
            ph = ih + m * 2;
        } else {
            [pw, ph] = PAGE_SIZES[pageSize];
            const wantLandscape =
                orientation === 'landscape' || (orientation === 'auto' && iw > ih);
            if (wantLandscape && pw < ph) [pw, ph] = [ph, pw];
            if (!wantLandscape && pw > ph) [pw, ph] = [ph, pw];
        }
        const availW = Math.max(pw - m * 2, 1);
        const availH = Math.max(ph - m * 2, 1);
        const scale = fit === 'cover'
            ? Math.max(availW / iw, availH / ih)
            : Math.min(availW / iw, availH / ih);
        return { pw, ph, dw: iw * scale, dh: ih * scale };
    };

    /* ---------- conversion ---------- */

    const handleConvert = async () => {
        cancelRef.current = false;
        setResult(null);
        setResultInfo(null);
        setModalError(null);
        setProgress(0);
        setMessage('Starting...');
        setStatus('processing');
        await tick();

        try {
            const total = items.length;
            const isTarget = quality === 'target' && targetBytes > 0;
            const overhead = 20 * 1024 + total * 700;

            // Plan every image first (layout + target pixel size + budget weight).
            const plans = items.map((it) => {
                const swap = it.rotation === 90 || it.rotation === 270;
                const iw = swap ? it.height : it.width;
                const ih = swap ? it.width : it.height;
                const L = layout(iw, ih);

                let cap = 1;
                if (isTarget) {
                    if (pageSize !== 'fit') {
                        const needSide = (Math.max(L.dw, L.dh) / 72) * TARGET_DPI;
                        cap = Math.min(1, needSide / Math.max(iw, ih));
                    }
                } else if (quality === 'high' || quality === 'medium' || quality === 'low') {
                    cap = Math.min(1, PRESETS[quality].maxSide / Math.max(iw, ih));
                }
                const w0 = Math.max(16, Math.round(iw * cap));
                const h0 = Math.max(16, Math.round(ih * cap));
                return { L, iw, ih, w0, h0, weight: w0 * h0 };
            });

            const encodeAll = async (pass: number, factor: number): Promise<Prepared[]> => {
                const base = [0, 60, 80, 88][pass] ?? 88;
                const span = [60, 20, 8, 4][pass] ?? 4;

                const usable = Math.max((targetBytes - overhead) * factor, total * 8 * 1024);
                let remaining = usable;
                let remainingWeight = plans.reduce((s, p) => s + p.weight, 0);
                const out: Prepared[] = [];

                for (let idx = 0; idx < total; idx++) {
                    if (cancelRef.current) throw new Error('cancelled');
                    const it = items[idx];
                    const p = plans[idx];
                    const isJpg = it.file.type === 'image/jpeg';
                    const isPng = it.file.type === 'image/png';

                    setMessage(
                        isTarget
                            ? `Pass ${pass + 1}: optimizing image ${idx + 1} of ${total}`
                            : `Adding image ${idx + 1} of ${total}`
                    );
                    setProgress(base + (idx / total) * span);
                    await tick();

                    // ---- Original quality: embed untouched whenever possible ----
                    if (quality === 'original') {
                        if (it.rotation === 0 && !grayscale && (isJpg || isPng)) {
                            const buf = await it.file.arrayBuffer();
                            out.push({ kind: isPng ? 'png' : 'jpg', bytes: buf, byteLength: buf.byteLength, ...p.L });
                            continue;
                        }
                        const img = await loadImage(it.url);
                        const keepAlpha = isPng;
                        const canvas = renderCanvas(img, it.rotation, p.iw, p.ih, grayscale, keepAlpha);
                        const bytes = keepAlpha
                            ? await canvasToBytes(canvas, 'image/png', 1)
                            : await canvasToBytes(canvas, 'image/jpeg', 0.95);
                        canvas.width = canvas.height = 0;
                        out.push({ kind: keepAlpha ? 'png' : 'jpg', bytes, byteLength: bytes.length, ...p.L });
                        continue;
                    }

                    // ---- Fixed presets: downscale + fixed JPEG quality ----
                    if (quality !== 'target') {
                        const img = await loadImage(it.url);
                        const canvas = renderCanvas(img, it.rotation, p.w0, p.h0, grayscale, false);
                        const bytes = await canvasToBytes(canvas, 'image/jpeg', PRESETS[quality].q);
                        canvas.width = canvas.height = 0;
                        out.push({ kind: 'jpg', bytes, byteLength: bytes.length, ...p.L });
                        continue;
                    }

                    // ---- Target size: budgeted encoding ----
                    const budget = Math.max(3000, (remaining * p.weight) / Math.max(1, remainingWeight));

                    if (isJpg && it.rotation === 0 && !grayscale && it.file.size <= budget) {
                        // Already small enough: keep the original bytes, no quality loss.
                        const buf = await it.file.arrayBuffer();
                        out.push({ kind: 'jpg', bytes: buf, byteLength: buf.byteLength, ...p.L });
                        remaining -= buf.byteLength;
                        remainingWeight -= p.weight;
                        continue;
                    }

                    const img = await loadImage(it.url);
                    const bytes = await encodeToBudget(img, it.rotation, p.w0, p.h0, budget, grayscale);
                    out.push({ kind: 'jpg', bytes, byteLength: bytes.length, ...p.L });
                    remaining -= bytes.length;
                    remainingWeight -= p.weight;
                }
                return out;
            };

            let prepared: Prepared[] = [];
            let factor = 1;
            let passesUsed = 0;
            const maxPasses = isTarget ? MAX_PASSES : 1;

            for (let pass = 0; pass < maxPasses; pass++) {
                prepared = await encodeAll(pass, factor);
                passesUsed = pass + 1;
                if (!isTarget) break;
                const sum = prepared.reduce((s, p) => s + p.byteLength, 0);
                if (sum + overhead <= targetBytes) break;
                const usableTarget = Math.max(targetBytes - overhead, 1);
                factor *= Math.max(0.3, (usableTarget / sum) * 0.96);
            }

            if (cancelRef.current) return;

            // Build the PDF.
            setMessage('Building PDF...');
            setProgress(93);
            await tick();

            const pdf = await PDFDocument.create();
            for (let i = 0; i < prepared.length; i++) {
                if (cancelRef.current) return;
                const p = prepared[i];
                const image = p.kind === 'png' ? await pdf.embedPng(p.bytes) : await pdf.embedJpg(p.bytes);
                const page = pdf.addPage([p.pw, p.ph]);
                page.drawImage(image, {
                    x: (p.pw - p.dw) / 2,
                    y: (p.ph - p.dh) / 2,
                    width: p.dw,
                    height: p.dh,
                });
            }

            setMessage('Saving PDF...');
            setProgress(97);
            await tick();
            const bytes = await pdf.save({ useObjectStreams: true });

            if (cancelRef.current) return;
            setResult(bytesToBlob(bytes));
            setResultInfo({
                inputBytes: totalSize,
                outputBytes: bytes.length,
                targetBytes: isTarget ? targetBytes : 0,
                hitTarget: !isTarget || bytes.length <= targetBytes,
                passes: passesUsed,
            });
            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            setStatus('done');
        } catch (e) {
            if (e instanceof Error && e.message === 'cancelled') return;
            console.error(e);
            setModalError('Failed to convert images to PDF. Please check your images and try again.');
            setStatus('error');
        }
    };

    const handleCancel = () => {
        cancelRef.current = true;
        setStatus('idle');
        setProgress(0);
    };

    const safeName = (outName.trim() || 'images').replace(/[\\/:*?"<>|]/g, '_');
    const selectCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500';
    const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

    const perImageKB = targetBytes && items.length ? targetBytes / items.length / 1024 : 0;

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl mb-4">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        JPG to PDF Converter Online Free
                    </h1>

                    <p className="text-gray-600 mt-3 max-w-3xl mx-auto">
                        Convert up to {MAX_IMAGES} JPG, PNG, WebP, GIF, BMP or AVIF images into one PDF.
                        Arrange the order, rotate pages, choose a page size, and set a target file size
                        such as 10 MB or 15 MB. Everything runs in your browser, so your images are never uploaded.
                    </p>
                </div>

                {items.length === 0 ? (
                    <FileDropzone
                        onFiles={addFiles}
                        accept={ACCEPT}
                        label="Click to select images"
                        hint={`Up to ${MAX_IMAGES} images — JPG, PNG, WebP, GIF, BMP, AVIF — or drag and drop here`}
                    />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Images ({items.length} / {MAX_IMAGES}) · {formatBytes(totalSize)}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => sortBy('asc')} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                                    <ArrowDownAZ className="w-4 h-4" /> A–Z
                                </button>
                                <button type="button" onClick={() => sortBy('desc')} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                                    <ArrowUpZA className="w-4 h-4" /> Z–A
                                </button>
                                <button type="button" onClick={resetAll} className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                                    Clear all
                                </button>
                            </div>
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map((it, index) => (
                                <li
                                    key={it.id}
                                    draggable
                                    onDragStart={() => setDragId(it.id)}
                                    onDragOver={(e) => { e.preventDefault(); setOverId(it.id); }}
                                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                                    onDrop={() => onDrop(it.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border bg-gray-50 transition ${overId === it.id && dragId !== it.id ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
                                        } ${dragId === it.id ? 'opacity-50' : ''}`}
                                >
                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab shrink-0" />
                                    <div className="w-20 h-20 shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={it.url}
                                            alt={it.file.name}
                                            draggable={false}
                                            className="max-w-full max-h-full object-contain transition-transform"
                                            style={{ transform: `rotate(${it.rotation}deg)` }}
                                        />
                                        <span className="absolute top-0.5 left-0.5 text-[10px] bg-purple-600 text-white px-1.5 rounded">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{it.file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {it.width}×{it.height} · {formatBytes(it.file.size)}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            <button type="button" onClick={() => rotate(it, -1)} className="p-1.5 rounded-lg hover:bg-gray-200" aria-label="Rotate left"><RotateCcw className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => rotate(it, 1)} className="p-1.5 rounded-lg hover:bg-gray-200" aria-label="Rotate right"><RotateCw className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => duplicate(index)} disabled={atLimit} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => remove(it.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4">
                            {atLimit ? (
                                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    You have reached the limit of {MAX_IMAGES} images. Remove some to add others.
                                </p>
                            ) : (
                                <FileDropzone
                                    onFiles={addFiles}
                                    accept={ACCEPT}
                                    compact
                                    label={`Add more images (${MAX_IMAGES - items.length} left)`}
                                />
                            )}
                        </div>

                        <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-gray-50">
                            <h4 className="text-sm font-bold text-gray-800 mb-3">PDF settings</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div>
                                    <label className={labelCls}>Page size</label>
                                    <select value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)} className={selectCls}>
                                        <option value="fit">Fit to image</option>
                                        <option value="a4">A4</option>
                                        <option value="letter">US Letter</option>
                                        <option value="legal">US Legal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Orientation</label>
                                    <select
                                        value={orientation}
                                        onChange={(e) => setOrientation(e.target.value as Orientation)}
                                        disabled={pageSize === 'fit'}
                                        className={`${selectCls} disabled:opacity-50`}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Margin</label>
                                    <select value={margin} onChange={(e) => setMargin(e.target.value)} className={selectCls}>
                                        <option value="none">None</option>
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Image fit</label>
                                    <select value={fit} onChange={(e) => setFit(e.target.value as Fit)} className={selectCls}>
                                        <option value="contain">Fit inside page</option>
                                        <option value="cover">Fill page</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Output size / quality</label>
                                    <select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className={selectCls}>
                                        <option value="target">Target size (MB)</option>
                                        <option value="original">Original quality</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low (smallest)</option>
                                    </select>
                                </div>
                            </div>

                            {quality === 'target' && (
                                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                                    <label htmlFor="target-size" className="block text-sm font-semibold text-gray-800">
                                        Target PDF size (MB)
                                    </label>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <input
                                            id="target-size"
                                            type="number"
                                            min={0.1}
                                            max={500}
                                            step="any"
                                            inputMode="decimal"
                                            value={targetMB}
                                            onChange={(e) => setTargetMB(e.target.value)}
                                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                                        />
                                        {[5, 10, 15, 25, 50].map((v) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setTargetMB(String(v))}
                                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${targetMB === String(v)
                                                    ? 'border-purple-600 bg-purple-50 text-purple-800'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {v} MB
                                            </button>
                                        ))}
                                    </div>
                                    {!targetValid && (
                                        <p className="mt-2 text-xs text-red-600">Enter a size between 0.1 and 500 MB.</p>
                                    )}
                                    {targetValid && perImageKB > 0 && perImageKB < 60 && (
                                        <p className="mt-2 text-xs text-amber-700">
                                            That is about {perImageKB.toFixed(0)} KB per image, so pictures will look quite blurry.
                                            A larger target will give better quality.
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        Images are resized and re-encoded to fit this size. Photos usually compress very well; transparent PNGs get a white background.
                                    </p>
                                </div>
                            )}

                            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={grayscale}
                                    onChange={(e) => setGrayscale(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                                />
                                Convert to grayscale for extra savings
                            </label>
                        </div>

                        {result && resultInfo && (
                            <div
                                className={`mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${resultInfo.hitTarget
                                    ? 'border-green-200 bg-green-50 text-green-900'
                                    : 'border-amber-200 bg-amber-50 text-amber-900'
                                    }`}
                            >
                                {resultInfo.hitTarget ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                )}
                                <div>
                                    <p className="font-semibold">
                                        {resultInfo.hitTarget ? 'Last PDF created' : 'Last PDF is above your target'}
                                    </p>
                                    <p className="mt-1">
                                        Images: {formatBytes(resultInfo.inputBytes)} → PDF: {formatBytes(resultInfo.outputBytes)}
                                        {resultInfo.inputBytes > resultInfo.outputBytes &&
                                            ` (${(((resultInfo.inputBytes - resultInfo.outputBytes) / resultInfo.inputBytes) * 100).toFixed(1)}% smaller)`}
                                        {resultInfo.targetBytes > 0 && ` · Target: ${formatBytes(resultInfo.targetBytes)}`}
                                        {resultInfo.passes > 1 && ` · ${resultInfo.passes} passes`}
                                    </p>
                                    {!resultInfo.hitTarget && (
                                        <p className="mt-1">Try a higher target, grayscale, or fewer images.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden sm:w-72">
                                <input
                                    value={outName}
                                    onChange={(e) => setOutName(e.target.value)}
                                    className="flex-1 px-3 py-3 text-sm focus:outline-none min-w-0"
                                    placeholder="File name"
                                />
                                <span className="px-3 text-sm text-gray-500 bg-gray-50 py-3">.pdf</span>
                            </div>
                            <div className="flex-1">
                                <ProcessButton
                                    onClick={handleConvert}
                                    loading={status === 'processing'}
                                    disabled={items.length === 0 || (quality === 'target' && !targetValid)}
                                    label={`Convert ${items.length} image${items.length > 1 ? 's' : ''} to PDF`}
                                    loadingLabel="Converting..."
                                />
                            </div>
                        </div>
                    </>
                )}

                {pageError && (
                    <p className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        {pageError}
                    </p>
                )}
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Converting to PDF"
                message={message}
                blob={result}
                filename={`${safeName}.pdf`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />
            <ToolSeoContent
                id="jpg-to-pdf"
                steps={[
                    `Click the upload area or drag and drop up to ${MAX_IMAGES} JPG, PNG, WebP, GIF, BMP or AVIF images.`,
                    'Drag images to change their order, rotate them, duplicate them or remove unwanted images.',
                    'Choose the PDF page size, orientation, margin and image fit.',
                    'Pick Target size and enter a size such as 10 or 15 MB, or choose a fixed quality preset.',
                    'Click Convert to create a single PDF, then download it. Your images are processed in your browser and are not uploaded.',
                ]}
            />
        </main>
    );
}