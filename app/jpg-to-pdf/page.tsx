'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
    ImageIcon, Trash2, ArrowUp, ArrowDown, GripVertical, RotateCcw, RotateCw,
    Copy, ArrowDownAZ, ArrowUpZA,
} from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import { uid, formatBytes, bytesToBlob } from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

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
type Quality = 'original' | 'high' | 'medium' | 'low';

const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
};
const MARGINS: Record<string, number> = { none: 0, small: 20, medium: 40, large: 70 };
const QUALITY: Record<Quality, number> = { original: 1, high: 0.9, medium: 0.7, low: 0.45 };
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif';

const tick = () => new Promise<void>((r) => setTimeout(r, 30));

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

export default function JpgToPdfPage() {
    const [items, setItems] = useState<ImgItem[]>([]);
    const [pageSize, setPageSize] = useState<PageSize>('a4');
    const [orientation, setOrientation] = useState<Orientation>('auto');
    const [margin, setMargin] = useState<string>('small');
    const [fit, setFit] = useState<Fit>('contain');
    const [quality, setQuality] = useState<Quality>('original');
    const [outName, setOutName] = useState('images');
    const [dragId, setDragId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const cancelRef = useRef(false);
    const urlsRef = useRef<string[]>([]);

    useEffect(() => {
        return () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
    }, []);

    const addFiles = async (files: File[]) => {
        setPageError(null);
        const added: ImgItem[] = [];
        for (const file of files) {
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
                setPageError(`"${file.name}" could not be read as an image.`);
            }
        }
        setItems((prev) => [...prev, ...added]);
    };

    const patch = (id: string, p: Partial<ImgItem>) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

    const rotate = (it: ImgItem, dir: 1 | -1) =>
        patch(it.id, { rotation: ((it.rotation + dir * 90 + 360) % 360) as ImgItem['rotation'] });

    const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

    const duplicate = (index: number) =>
        setItems((prev) => {
            const next = [...prev];
            next.splice(index + 1, 0, { ...prev[index], id: uid() });
            return next;
        });

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
        setStatus('idle');
        setProgress(0);
        setOutName('images');
        setPageError(null);
    };

    const totalSize = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items]);

    const prepareImage = async (it: ImgItem, pdf: PDFDocument) => {
        const isJpg = it.file.type === 'image/jpeg';
        const isPng = it.file.type === 'image/png';
        const q = QUALITY[quality];

        if (it.rotation === 0 && quality === 'original' && (isJpg || isPng)) {
            const buf = await it.file.arrayBuffer();
            return isPng ? pdf.embedPng(buf) : pdf.embedJpg(buf);
        }

        const img = await loadImage(it.url);
        const swap = it.rotation === 90 || it.rotation === 270;
        const canvas = document.createElement('canvas');
        canvas.width = swap ? img.naturalHeight : img.naturalWidth;
        canvas.height = swap ? img.naturalWidth : img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');

        const keepAlpha = isPng && quality === 'original';
        if (!keepAlpha) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((it.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        if (keepAlpha) return pdf.embedPng(await canvasToBytes(canvas, 'image/png', 1));
        return pdf.embedJpg(await canvasToBytes(canvas, 'image/jpeg', q));
    };

    const handleConvert = async () => {
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(0);
        setMessage('Starting...');
        setStatus('processing');
        await tick();

        try {
            const pdf = await PDFDocument.create();
            const m = MARGINS[margin] ?? 0;
            const total = items.length;

            for (let idx = 0; idx < total; idx++) {
                if (cancelRef.current) return;
                const it = items[idx];
                setMessage(`Adding image ${idx + 1} of ${total}`);

                const image = await prepareImage(it, pdf);
                const iw = image.width;
                const ih = image.height;

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
                const dw = iw * scale;
                const dh = ih * scale;

                const page = pdf.addPage([pw, ph]);
                page.drawImage(image, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });

                setProgress(((idx + 1) / total) * 90);
                await tick();
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

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl mb-4">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">JPG to PDF Converter</h1>
                    <p className="text-gray-600 mt-2">
                        Turn JPG, PNG, WebP and more into one PDF. Reorder, rotate, and set page size.
                    </p>
                </div>

                {items.length === 0 ? (
                    <FileDropzone
                        onFiles={addFiles}
                        accept={ACCEPT}
                        label="Click to select images"
                        hint="JPG, PNG, WebP, GIF, BMP, AVIF — or drag and drop here"
                    />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Images ({items.length}) · {formatBytes(totalSize)}
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
                                            <button type="button" onClick={() => duplicate(index)} className="p-1.5 rounded-lg hover:bg-gray-200" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => remove(it.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4">
                            <FileDropzone onFiles={addFiles} accept={ACCEPT} compact label="Add more images" />
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
                                    <label className={labelCls}>Quality</label>
                                    <select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className={selectCls}>
                                        <option value="original">Original</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low (smallest)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

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
                                    disabled={items.length === 0}
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
                    'Click the upload area or drag your images in (JPG, PNG, WebP, GIF, BMP or AVIF).',
                    'Drag to reorder, rotate or duplicate images as needed.',
                    'Choose the page size, orientation, margin, image fit and quality.',
                    'Click Convert, then download your PDF.',
                ]}
            />
        </main>
    );
}