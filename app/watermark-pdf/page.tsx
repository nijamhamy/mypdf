'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Stamp, FileText, AlertCircle, ImageIcon, Type, X } from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import { formatBytes, bytesToBlob, parsePageRange, renderPdfThumbnails } from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

type WmMode = 'text' | 'image';
type Pos = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
type PageSel = 'all' | 'odd' | 'even' | 'custom';
type FontKey = 'helveticaBold' | 'helvetica' | 'timesBold' | 'times' | 'courierBold';

const FONTS: Record<FontKey, { label: string; std: StandardFonts; css: string; weight: number; style?: string }> = {
    helveticaBold: { label: 'Helvetica Bold', std: StandardFonts.HelveticaBold, css: 'Helvetica, Arial, sans-serif', weight: 700 },
    helvetica: { label: 'Helvetica', std: StandardFonts.Helvetica, css: 'Helvetica, Arial, sans-serif', weight: 400 },
    timesBold: { label: 'Times Bold', std: StandardFonts.TimesRomanBold, css: 'Times New Roman, serif', weight: 700 },
    times: { label: 'Times Roman', std: StandardFonts.TimesRoman, css: 'Times New Roman, serif', weight: 400 },
    courierBold: { label: 'Courier Bold', std: StandardFonts.CourierBold, css: 'Courier New, monospace', weight: 700 },
};

const POS_GRID: Pos[] = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
const IMG_ACCEPT = 'image/png,image/jpeg,.png,.jpg,.jpeg';
const PREVIEW_W = 300;
const MAX_TILES = 600;
const CAP = 0.72;

const tick = () => new Promise<void>((r) => setTimeout(r, 20));

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

function cleanText(t: string) {
    return t.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function applyTokens(text: string, page: number, total: number) {
    const date = new Date().toLocaleDateString();
    return text
        .replace(/\{page\}/gi, String(page))
        .replace(/\{total\}/gi, String(total))
        .replace(/\{date\}/gi, date);
}

/** Centers (PDF coordinates, y up) where the watermark box must be placed. */
function placements(
    W: number, H: number, bw: number, bh: number, rotDeg: number,
    pos: Pos, margin: number, tile: boolean, spacing: number
): { cx: number; cy: number }[] {
    const r = (rotDeg * Math.PI) / 180;
    const c = Math.abs(Math.cos(r));
    const s = Math.abs(Math.sin(r));
    const bbw = bw * c + bh * s;
    const bbh = bw * s + bh * c;

    if (tile) {
        const stepX = Math.max(bbw * (1 + spacing / 100), 10);
        const stepY = Math.max(bbh * (1 + spacing / 100), 10);
        const rows = Math.ceil(H / stepY) + 1;
        const cols = Math.ceil(W / stepX) + 2;
        if (rows * cols <= MAX_TILES) {
            const out: { cx: number; cy: number }[] = [];
            for (let i = 0; i < rows; i++) {
                const cy = i * stepY + stepY / 2;
                for (let j = -1; j < cols; j++) {
                    const cx = j * stepX + (i % 2 ? stepX / 2 : stepX / 4) + stepX / 4;
                    if (cx > -bbw / 2 && cx < W + bbw / 2 && cy > -bbh / 2 && cy < H + bbh / 2) out.push({ cx, cy });
                }
            }
            return out;
        }
    }

    const v = pos[0];
    const h = pos[1];
    const cx = h === 'l' ? margin + bbw / 2 : h === 'r' ? W - margin - bbw / 2 : W / 2;
    const cy = v === 't' ? H - margin - bbh / 2 : v === 'b' ? margin + bbh / 2 : H / 2;
    return [{ cx, cy }];
}

function originFromCenter(cx: number, cy: number, bw: number, bh: number, rotDeg: number) {
    const r = (rotDeg * Math.PI) / 180;
    return {
        x: cx - ((bw / 2) * Math.cos(r) - (bh / 2) * Math.sin(r)),
        y: cy - ((bw / 2) * Math.sin(r) + (bh / 2) * Math.cos(r)),
    };
}

export default function AddWatermarkPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [firstSize, setFirstSize] = useState<{ w: number; h: number } | null>(null);
    const [thumb, setThumb] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [wmMode, setWmMode] = useState<WmMode>('text');
    const [text, setText] = useState('CONFIDENTIAL');
    const [fontKey, setFontKey] = useState<FontKey>('helveticaBold');
    const [fontSize, setFontSize] = useState(60);
    const [color, setColor] = useState('#888888');
    const [opacity, setOpacity] = useState(35);
    const [rotation, setRotation] = useState(45);
    const [pos, setPos] = useState<Pos>('mc');
    const [margin, setMargin] = useState(30);
    const [tile, setTile] = useState(false);
    const [spacing, setSpacing] = useState(60);
    const [pageSel, setPageSel] = useState<PageSel>('all');
    const [customRange, setCustomRange] = useState('');
    const [outName, setOutName] = useState('watermarked');

    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
    const [imgWidthPct, setImgWidthPct] = useState(40);

    const [previewFont, setPreviewFont] = useState<PDFFont | null>(null);

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const cancelRef = useRef(false);
    const loadToken = useRef(0);
    const imgUrlRef = useRef<string | null>(null);

    useEffect(() => () => {
        loadToken.current++;
        if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const d = await PDFDocument.create();
            const f = await d.embedFont(FONTS[fontKey].std);
            if (!cancelled) setPreviewFont(f);
        })();
        return () => { cancelled = true; };
    }, [fontKey]);

    const loadFile = async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        const token = ++loadToken.current;
        setLoadError(null);
        setThumb(null);
        try {
            const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
            const { width, height } = doc.getPage(0).getSize();
            setFile(f);
            setPageCount(doc.getPageCount());
            setFirstSize({ w: width, h: height });
            setCustomRange('');
            setOutName((f.name.replace(/\.pdf$/i, '') || 'watermarked') + '-watermarked');
            let got = false;
            renderPdfThumbnails(
                f,
                (_i, url) => { if (token === loadToken.current) setThumb(url); got = true; },
                () => got || token !== loadToken.current,
                480
            ).catch(() => { /* preview optional */ });
        } catch {
            setLoadError('This PDF could not be read. It may be corrupted or password protected.');
        }
    };

    const loadImage = (files: File[]) => {
        const f = files[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
            if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
            imgUrlRef.current = url;
            setImgFile(f);
            setImgUrl(url);
            setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => { URL.revokeObjectURL(url); setLoadError('That image could not be read.'); };
        img.src = url;
    };

    const clearImage = () => {
        if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
        imgUrlRef.current = null;
        setImgFile(null);
        setImgUrl(null);
        setImgDims(null);
    };

    const rangeInvalid =
        pageSel === 'custom' && (customRange.trim() === '' || parsePageRange(customRange, pageCount) === null);

    const targetIdx = useMemo(() => {
        if (!pageCount) return [] as number[];
        const all = Array.from({ length: pageCount }, (_, i) => i);
        if (pageSel === 'odd') return all.filter((i) => i % 2 === 0);
        if (pageSel === 'even') return all.filter((i) => i % 2 === 1);
        if (pageSel === 'custom') {
            const p = parsePageRange(customRange, pageCount);
            return p ? Array.from(new Set(p)).sort((a, b) => a - b) : [];
        }
        return all;
    }, [pageSel, customRange, pageCount]);

    const strippedChars = wmMode === 'text' && cleanText(text) !== text;

    const preview = useMemo(() => {
        if (!firstSize) return null;
        const W = firstSize.w;
        const H = firstSize.h;
        let bw = 0;
        let bh = 0;
        let label = '';
        if (wmMode === 'text') {
            if (!previewFont) return null;
            label = cleanText(applyTokens(text, 1, pageCount));
            if (!label) return null;
            bw = previewFont.widthOfTextAtSize(label, fontSize);
            bh = fontSize * CAP;
        } else {
            if (!imgDims) return null;
            bw = (W * imgWidthPct) / 100;
            bh = bw * (imgDims.h / imgDims.w);
        }
        const spots = placements(W, H, bw, bh, rotation, pos, margin, tile, spacing);
        return { W, H, bw, bh, label, spots };
    }, [firstSize, wmMode, previewFont, text, pageCount, fontSize, imgDims, imgWidthPct, rotation, pos, margin, tile, spacing]);

    const scale = firstSize ? PREVIEW_W / firstSize.w : 1;
    const previewH = firstSize ? firstSize.h * scale : 400;

    const canRun =
        !!file && targetIdx.length > 0 && !rangeInvalid &&
        (wmMode === 'text' ? cleanText(text).trim().length > 0 : !!imgFile);

    const handleApply = async () => {
        if (!file) return;
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(0);
        setMessage('Loading PDF...');
        setStatus('processing');
        await tick();

        try {
            const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
            const pages = pdf.getPages();
            const total = pages.length;
            const op = opacity / 100;

            const font = wmMode === 'text' ? await pdf.embedFont(FONTS[fontKey].std) : null;
            const textColor = hexToRgb(color);

            let image: Awaited<ReturnType<PDFDocument['embedPng']>> | null = null;
            if (wmMode === 'image' && imgFile) {
                const buf = await imgFile.arrayBuffer();
                image = imgFile.type === 'image/png' ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
            }

            for (let k = 0; k < targetIdx.length; k++) {
                if (cancelRef.current) return;
                const idx = targetIdx[k];
                const page = pages[idx];
                const { width: W, height: H } = page.getSize();

                if (wmMode === 'text' && font) {
                    const label = cleanText(applyTokens(text, idx + 1, total));
                    if (label) {
                        const bw = font.widthOfTextAtSize(label, fontSize);
                        const bh = fontSize * CAP;
                        for (const { cx, cy } of placements(W, H, bw, bh, rotation, pos, margin, tile, spacing)) {
                            const o = originFromCenter(cx, cy, bw, bh, rotation);
                            page.drawText(label, {
                                x: o.x, y: o.y, size: fontSize, font,
                                color: textColor, opacity: op, rotate: degrees(rotation),
                            });
                        }
                    }
                } else if (image) {
                    const bw = (W * imgWidthPct) / 100;
                    const bh = bw * (image.height / image.width);
                    for (const { cx, cy } of placements(W, H, bw, bh, rotation, pos, margin, tile, spacing)) {
                        const o = originFromCenter(cx, cy, bw, bh, rotation);
                        page.drawImage(image, {
                            x: o.x, y: o.y, width: bw, height: bh,
                            opacity: op, rotate: degrees(rotation),
                        });
                    }
                }

                if (k % 5 === 0 || k === targetIdx.length - 1) {
                    setMessage(`Stamping page ${idx + 1} (${k + 1} of ${targetIdx.length})`);
                    setProgress(((k + 1) / targetIdx.length) * 90);
                    await tick();
                }
            }

            if (cancelRef.current) return;
            setMessage('Saving PDF...');
            setProgress(95);
            await tick();
            const bytes = await pdf.save();

            if (cancelRef.current) return;
            setResult(bytesToBlob(bytes));
            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            setStatus('done');
        } catch (e) {
            console.error(e);
            setModalError('Failed to add the watermark. Please try again.');
            setStatus('error');
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus('idle'); setProgress(0); };
    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const resetAll = () => {
        loadToken.current++;
        setFile(null);
        setThumb(null);
        setPageCount(0);
        setFirstSize(null);
        setResult(null);
        setStatus('idle');
        setProgress(0);
        setLoadError(null);
    };

    const safeName = (outName.trim() || 'watermarked').replace(/[\\/:*?"<>|]/g, '_');
    const selectCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
    const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';
    const card = 'p-4 rounded-2xl border border-gray-200 bg-gray-50';

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
                        <Stamp className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        Add Watermark to PDF Online Free
                    </h1>

                    <p className="text-gray-600 mt-3 max-w-3xl mx-auto">
                        Add a text or image watermark to PDF files online for free. Mark documents
                        as CONFIDENTIAL, DRAFT or COPY, add your business logo, choose the
                        position, opacity, rotation and pages, then download your watermarked PDF
                        directly from your browser.
                    </p>
                </div>

                {!file ? (
                    <FileDropzone onFiles={loadFile} multiple={false} label="Click to select a PDF file" />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-indigo-700 font-medium">
                                        {pageCount} pages · {formatBytes(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-600 hover:underline font-medium shrink-0">
                                Change file
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                            <div className="space-y-5 order-2 lg:order-1">
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { k: 'text', t: 'Text watermark', I: Type },
                                        { k: 'image', t: 'Image watermark', I: ImageIcon },
                                    ] as const).map(({ k, t, I }) => (
                                        <button
                                            type="button"
                                            key={k}
                                            onClick={() => setWmMode(k)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold ${wmMode === k ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <I className="w-4 h-4" /> {t}
                                        </button>
                                    ))}
                                </div>

                                {wmMode === 'text' ? (
                                    <section className={card}>
                                        <h4 className="text-sm font-bold text-gray-800 mb-3">Text</h4>
                                        <label className={labelCls}>
                                            Watermark text — tokens: {'{page}'} {'{total}'} {'{date}'}
                                        </label>
                                        <input
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="CONFIDENTIAL"
                                            className={selectCls}
                                        />
                                        {strippedChars && (
                                            <p className="mt-2 text-xs text-amber-700">
                                                Some characters (for example Tamil or Arabic letters) are not supported by PDF built-in fonts and will be skipped. Use an image watermark for those languages.
                                            </p>
                                        )}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                            <div>
                                                <label className={labelCls}>Font</label>
                                                <select value={fontKey} onChange={(e) => setFontKey(e.target.value as FontKey)} className={selectCls}>
                                                    {Object.entries(FONTS).map(([k, v]) => (
                                                        <option key={k} value={k}>{v.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Size: {fontSize} pt</label>
                                                <input type="range" min={10} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value, 10))} className="w-full accent-indigo-600" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Color</label>
                                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-9 p-1 border border-gray-300 rounded-lg bg-white cursor-pointer" />
                                            </div>
                                        </div>
                                    </section>
                                ) : (
                                    <section className={card}>
                                        <h4 className="text-sm font-bold text-gray-800 mb-3">Image</h4>
                                        {!imgFile ? (
                                            <FileDropzone onFiles={loadImage} multiple={false} accept={IMG_ACCEPT} compact label="Select a PNG or JPG logo" />
                                        ) : (
                                            <div className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={imgUrl ?? ''} alt="Watermark" className="w-14 h-14 object-contain bg-gray-100 rounded-lg" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{imgFile.name}</p>
                                                    <p className="text-xs text-gray-500">{imgDims?.w}×{imgDims?.h} · {formatBytes(imgFile.size)}</p>
                                                </div>
                                                <button type="button" onClick={clearImage} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove image">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="mt-3">
                                            <label className={labelCls}>Width: {imgWidthPct}% of page width</label>
                                            <input type="range" min={5} max={100} value={imgWidthPct} onChange={(e) => setImgWidthPct(parseInt(e.target.value, 10))} className="w-full accent-indigo-600" />
                                        </div>
                                    </section>
                                )}

                                <section className={card}>
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Style</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Opacity: {opacity}%</label>
                                            <input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value, 10))} className="w-full accent-indigo-600" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Rotation: {rotation}°</label>
                                            <input type="range" min={-180} max={180} value={rotation} onChange={(e) => setRotation(parseInt(e.target.value, 10))} className="w-full accent-indigo-600" />
                                            <div className="flex gap-1 mt-1">
                                                {[0, 45, -45, 90].map((a) => (
                                                    <button type="button" key={a} onClick={() => setRotation(a)} className="px-2 py-0.5 text-xs border rounded bg-white hover:bg-gray-100">{a}°</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className={card}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-gray-800">Position</h4>
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input type="checkbox" checked={tile} onChange={(e) => setTile(e.target.checked)} className="accent-indigo-600" />
                                            Repeat across page (tile)
                                        </label>
                                    </div>
                                    {!tile ? (
                                        <div className="flex flex-wrap gap-6 items-start">
                                            <div className="grid grid-cols-3 gap-1 w-28">
                                                {POS_GRID.map((p) => (
                                                    <button
                                                        type="button"
                                                        key={p}
                                                        onClick={() => setPos(p)}
                                                        aria-label={`Position ${p}`}
                                                        className={`h-8 rounded border ${pos === p ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex-1 min-w-[160px]">
                                                <label className={labelCls}>Edge margin: {margin} pt</label>
                                                <input type="range" min={0} max={150} value={margin} onChange={(e) => setMargin(parseInt(e.target.value, 10))} className="w-full accent-indigo-600" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className={labelCls}>Spacing between copies: {spacing}%</label>
                                            <input type="range" min={0} max={300} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} className="w-full accent-indigo-600" />
                                        </div>
                                    )}
                                </section>

                                <section className={card}>
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Pages</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {([
                                            ['all', 'All pages'], ['odd', 'Odd pages'], ['even', 'Even pages'], ['custom', 'Custom range'],
                                        ] as [PageSel, string][]).map(([k, l]) => (
                                            <button
                                                type="button"
                                                key={k}
                                                onClick={() => setPageSel(k)}
                                                className={`px-3 py-1.5 text-xs border rounded-lg ${pageSel === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-100'}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                    {pageSel === 'custom' && (
                                        <div className="mt-3">
                                            <input
                                                value={customRange}
                                                onChange={(e) => setCustomRange(e.target.value)}
                                                placeholder="e.g. 1-3, 5, 8-10"
                                                className={`${selectCls} ${rangeInvalid ? 'border-red-500' : ''}`}
                                            />
                                            {rangeInvalid && (
                                                <p className="mt-1 text-xs text-red-600">Use pages from 1 to {pageCount}, e.g. 1-3, 5.</p>
                                            )}
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        {targetIdx.length} of {pageCount} pages will be watermarked
                                    </p>
                                </section>
                            </div>

                            <aside className="order-1 lg:order-2">
                                <div className="lg:sticky lg:top-6">
                                    <p className="text-xs font-semibold text-gray-600 mb-2 text-center">Live preview (page 1)</p>
                                    <div
                                        className="relative mx-auto bg-white border border-gray-300 shadow-md overflow-hidden"
                                        style={{ width: PREVIEW_W, height: previewH }}
                                    >
                                        {thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumb} alt="Page 1" className="absolute inset-0 w-full h-full object-fill" draggable={false} />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Loading preview…</div>
                                        )}
                                        {preview && preview.spots.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    position: 'absolute',
                                                    left: s.cx * scale,
                                                    top: (preview.H - s.cy) * scale,
                                                    width: preview.bw * scale,
                                                    height: preview.bh * scale,
                                                    transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                                                    opacity: opacity / 100,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    pointerEvents: 'none',
                                                }}
                                            >
                                                {wmMode === 'text' ? (
                                                    <span
                                                        style={{
                                                            fontSize: fontSize * scale,
                                                            color,
                                                            fontFamily: FONTS[fontKey].css,
                                                            fontWeight: FONTS[fontKey].weight,
                                                            lineHeight: 1,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {preview.label}
                                                    </span>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={imgUrl ?? ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill' }} draggable={false} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 text-center">
                                        Preview is a close match to the final result.
                                    </p>
                                </div>
                            </aside>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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
                                    onClick={handleApply}
                                    loading={status === 'processing'}
                                    disabled={!canRun}
                                    label="Add Watermark"
                                    loadingLabel="Adding watermark..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {loadError && (
                    <div className="mt-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" /> <span>{loadError}</span>
                    </div>
                )}
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Adding watermark"
                message={message}
                blob={result}
                filename={`${safeName}.pdf`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />

            <ToolSeoContent
                id="watermark-pdf"
                steps={[
                    'Click the upload area or drag and drop the PDF file you want to watermark.',
                    'Choose a text watermark or upload a PNG or JPG logo as an image watermark.',
                    'For a text watermark, enter text such as CONFIDENTIAL, DRAFT or COPY, then choose the font, size and color.',
                    'Set the watermark opacity, rotation, position and edge margin, or enable tiling to repeat it across the page.',
                    'Choose all pages, odd pages, even pages or a custom page range.',
                    'Check the live preview, then click Add Watermark and download your watermarked PDF.',
                ]}
            />
        </main>
    );
}