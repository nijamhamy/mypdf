'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Image as ImageIcon, FileText, AlertCircle, Check } from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import { formatBytes, parsePageRange, renderPdfThumbnails } from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

type Format = 'jpg' | 'png' | 'webp';

const FORMATS: Record<Format, { label: string; mime: string; ext: string }> = {
    jpg: { label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
    png: { label: 'PNG (lossless)', mime: 'image/png', ext: 'png' },
    webp: { label: 'WebP', mime: 'image/webp', ext: 'webp' },
};
const DPI_OPTIONS = [72, 100, 150, 200, 300];
const MAX_PIXELS = 25_000_000;

const tick = () => new Promise<void>((r) => setTimeout(r, 20));

function selectedToRange(sel: boolean[]): string {
    if (sel.every(Boolean)) return '';
    const parts: string[] = [];
    let i = 0;
    while (i < sel.length) {
        if (!sel[i]) { i++; continue; }
        let j = i;
        while (j + 1 < sel.length && sel[j + 1]) j++;
        parts.push(i === j ? `${i + 1}` : `${i + 1}-${j + 1}`);
        i = j + 1;
    }
    return parts.join(', ');
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), type, quality);
    });
}

export default function PdfToJpgPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [selected, setSelected] = useState<boolean[]>([]);
    const [range, setRange] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);

    const [format, setFormat] = useState<Format>('jpg');
    const [dpi, setDpi] = useState(150);
    const [quality, setQuality] = useState(90);
    const [outName, setOutName] = useState('pages');

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [resultName, setResultName] = useState('pages.zip');
    const [modalError, setModalError] = useState<string | null>(null);
    const cancelRef = useRef(false);
    const mounted = useRef(true);
    const loadToken = useRef(0);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; loadToken.current++; };
    }, []);

    const loadFile = async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        const token = ++loadToken.current;
        setLoadError(null);
        setThumbs({});
        try {
            const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
            const { width, height } = doc.getPage(0).getSize();
            const count = doc.getPageCount();
            setFile(f);
            setPageCount(count);
            setPageSize({ w: width, h: height });
            setSelected(Array(count).fill(true));
            setRange('');
            setOutName(f.name.replace(/\.pdf$/i, '') || 'pages');
            renderPdfThumbnails(
                f,
                (idx, url) => {
                    if (!mounted.current || token !== loadToken.current) return;
                    setThumbs((prev) => ({ ...prev, [idx]: url }));
                },
                () => !mounted.current || token !== loadToken.current,
                130
            ).catch(() => { /* previews optional */ });
        } catch {
            setLoadError('This PDF could not be read. It may be corrupted or password protected.');
        }
    };

    const rangeInvalid = range.trim() !== '' && parsePageRange(range, pageCount) === null;

    const onRangeChange = (value: string) => {
        setRange(value);
        const parsed = parsePageRange(value, pageCount);
        if (parsed) {
            const sel = Array(pageCount).fill(false);
            parsed.forEach((p) => (sel[p] = true));
            setSelected(sel);
        }
    };

    const togglePage = (i: number) => {
        const sel = [...selected];
        sel[i] = !sel[i];
        setSelected(sel);
        setRange(selectedToRange(sel));
    };

    const setAll = (v: boolean) => {
        setSelected(Array(pageCount).fill(v));
        setRange('');
    };

    const selectedIdx = useMemo(
        () => selected.map((s, i) => (s ? i : -1)).filter((i) => i >= 0),
        [selected]
    );

    const outputDims = useMemo(() => {
        if (!pageSize) return null;
        let scale = dpi / 72;
        const px = pageSize.w * scale * pageSize.h * scale;
        let limited = false;
        if (px > MAX_PIXELS) {
            scale = scale * Math.sqrt(MAX_PIXELS / px);
            limited = true;
        }
        return { w: Math.round(pageSize.w * scale), h: Math.round(pageSize.h * scale), limited };
    }, [pageSize, dpi]);

    const handleConvert = async () => {
        if (!file || selectedIdx.length === 0) return;
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(0);
        setMessage('Loading PDF...');
        setStatus('processing');
        await tick();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let loadingTask: any = null;
        try {
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                'pdfjs-dist/build/pdf.worker.min.mjs',
                import.meta.url
            ).toString();

            const data = new Uint8Array(await file.arrayBuffer());
            loadingTask = pdfjs.getDocument({ data });
            const doc = await loadingTask.promise;

            const fmt = FORMATS[format];
            const q = format === 'png' ? undefined : quality / 100;
            const base = (outName.trim() || 'pages').replace(/[\\/:*?"<>|]/g, '_');
            const pad = String(pageCount).length;
            const total = selectedIdx.length;
            const rendered: { name: string; blob: Blob }[] = [];

            for (let k = 0; k < total; k++) {
                if (cancelRef.current) return;
                const pageNo = selectedIdx[k] + 1;
                setMessage(`Rendering page ${pageNo} (${k + 1} of ${total})`);
                await tick();

                const page = await doc.getPage(pageNo);
                const base1 = page.getViewport({ scale: 1 });
                let scale = dpi / 72;
                const px = base1.width * scale * base1.height * scale;
                if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px);
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas not supported');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
                const blob = await canvasToBlob(canvas, fmt.mime, q);
                canvas.width = 0;
                canvas.height = 0;

                rendered.push({
                    name: `${base}-page-${String(pageNo).padStart(pad, '0')}.${fmt.ext}`,
                    blob,
                });
                setProgress(((k + 1) / total) * (total > 1 ? 85 : 95));
            }

            if (cancelRef.current) return;

            if (rendered.length === 1) {
                setResult(rendered[0].blob);
                setResultName(rendered[0].name);
            } else {
                setMessage('Creating ZIP file...');
                await tick();
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                rendered.forEach((r) => zip.file(r.name, r.blob));
                const zipBlob = await zip.generateAsync(
                    { type: 'blob', compression: 'STORE' },
                    (meta) => {
                        if (!cancelRef.current) setProgress(85 + (meta.percent / 100) * 14);
                    }
                );
                if (cancelRef.current) return;
                setResult(zipBlob);
                setResultName(`${base}-images.zip`);
            }

            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            setStatus('done');
        } catch (e) {
            console.error(e);
            setModalError('Failed to convert the PDF. Try a lower DPI or fewer pages.');
            setStatus('error');
        } finally {
            if (loadingTask) {
                try { await loadingTask.destroy(); } catch { /* ignore */ }
            }
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus('idle'); setProgress(0); };
    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const resetAll = () => {
        loadToken.current++;
        setFile(null);
        setThumbs({});
        setSelected([]);
        setPageCount(0);
        setPageSize(null);
        setRange('');
        setResult(null);
        setStatus('idle');
        setProgress(0);
        setLoadError(null);
    };

    const selectCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500';
    const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';
    const canRun = !!file && selectedIdx.length > 0 && !rangeInvalid;

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mb-4">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">PDF to JPG Converter</h1>
                    <p className="text-gray-600 mt-2">
                        Convert PDF pages to JPG, PNG or WebP images. Pick pages, resolution and quality.
                    </p>
                </div>

                {!file ? (
                    <FileDropzone onFiles={loadFile} multiple={false} label="Click to select a PDF file" />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-6 h-6 text-amber-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-amber-700 font-medium">
                                        {pageCount} pages · {formatBytes(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-600 hover:underline font-medium shrink-0">
                                Change file
                            </button>
                        </div>

                        <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                            <h4 className="text-sm font-bold text-gray-800 mb-3">Image settings</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className={labelCls}>Format</label>
                                    <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className={selectCls}>
                                        {Object.entries(FORMATS).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Resolution (DPI)</label>
                                    <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value, 10))} className={selectCls}>
                                        {DPI_OPTIONS.map((d) => (
                                            <option key={d} value={d}>{d} DPI</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Quality: {format === 'png' ? 'lossless' : `${quality}%`}</label>
                                    <input
                                        type="range" min={30} max={100} value={quality}
                                        disabled={format === 'png'}
                                        onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                                        className="w-full accent-amber-600 disabled:opacity-40"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>File name prefix</label>
                                    <input value={outName} onChange={(e) => setOutName(e.target.value)} className={selectCls} />
                                </div>
                            </div>
                            {outputDims && (
                                <p className="mt-3 text-xs text-gray-500">
                                    Each image will be about {outputDims.w} × {outputDims.h} px
                                    {outputDims.limited && ' (reduced to stay within browser memory limits)'}.
                                </p>
                            )}
                        </section>

                        <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800">
                                    Pages ({selectedIdx.length} of {pageCount} selected)
                                </h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        value={range}
                                        onChange={(e) => onRangeChange(e.target.value)}
                                        placeholder="All pages (e.g. 1-3, 5)"
                                        className={`w-48 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${rangeInvalid ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    <button type="button" onClick={() => setAll(true)} className="px-3 py-1.5 text-xs border rounded-lg bg-white hover:bg-gray-100">Select all</button>
                                    <button type="button" onClick={() => setAll(false)} className="px-3 py-1.5 text-xs border rounded-lg bg-white hover:bg-gray-100">Select none</button>
                                </div>
                            </div>
                            {rangeInvalid && (
                                <p className="mb-2 text-xs text-red-600">Use pages from 1 to {pageCount}, e.g. 1-3, 5.</p>
                            )}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
                                {selected.map((on, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        onClick={() => togglePage(i)}
                                        className={`relative rounded-lg border-2 overflow-hidden bg-white aspect-[3/4] flex items-center justify-center ${on ? 'border-amber-500' : 'border-gray-200 opacity-50'
                                            }`}
                                    >
                                        {thumbs[i] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumbs[i]} alt={`Page ${i + 1}`} className="w-full h-full object-contain" draggable={false} />
                                        ) : (
                                            <span className="text-xs text-gray-400">Loading…</span>
                                        )}
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">{i + 1}</span>
                                        {on && (
                                            <span className="absolute top-1 right-1 bg-amber-600 text-white rounded-full p-0.5">
                                                <Check className="w-3 h-3" />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <ProcessButton
                            onClick={handleConvert}
                            loading={status === 'processing'}
                            disabled={!canRun}
                            label={
                                selectedIdx.length === 1
                                    ? 'Convert 1 page to image'
                                    : `Convert ${selectedIdx.length} pages to images (ZIP)`
                            }
                            loadingLabel="Converting..."
                        />
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
                title="Converting PDF to images"
                message={message}
                blob={result}
                filename={resultName}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />

            <ToolSeoContent
                id="pdf-to-jpg"
                steps={[
                    'Click the upload area to select the PDF you want to convert.',
                    'Choose the format (JPG, PNG or WebP), the resolution from 72 to 300 DPI, and the quality.',
                    'Click the page thumbnails to choose pages, or type a range such as 1-3, 5.',
                    'Click Convert and download your image. Several pages come as one ZIP file.',
                ]}
            />
        </main>
    );
}