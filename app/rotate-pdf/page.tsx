'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
    RotateCw, RotateCcw, FileText, AlertCircle, Trash2, Undo2, Check, Eraser,
} from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import { formatBytes, bytesToBlob, renderPdfThumbnails } from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

interface PageState {
    rot: number;
    removed: boolean;
    selected: boolean;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 20));
const norm = (a: number) => ((a % 360) + 360) % 360;

export default function RotatePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageState[]>([]);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [outName, setOutName] = useState('rotated');

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
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
            const count = doc.getPageCount();
            setFile(f);
            setPages(Array.from({ length: count }, () => ({ rot: 0, removed: false, selected: false })));
            setOutName((f.name.replace(/\.pdf$/i, '') || 'rotated') + '-rotated');
            renderPdfThumbnails(
                f,
                (idx, url) => {
                    if (!mounted.current || token !== loadToken.current) return;
                    setThumbs((prev) => ({ ...prev, [idx]: url }));
                },
                () => !mounted.current || token !== loadToken.current,
                170
            ).catch(() => { /* previews optional */ });
        } catch {
            setLoadError('This PDF could not be read. It may be corrupted or password protected.');
        }
    };

    const updatePage = (i: number, p: Partial<PageState>) =>
        setPages((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...p } : x)));

    const rotatePage = (i: number, delta: number) =>
        setPages((prev) => prev.map((x, idx) => (idx === i ? { ...x, rot: norm(x.rot + delta) } : x)));

    const rotateWhere = (delta: number, pred: (p: PageState, i: number) => boolean) =>
        setPages((prev) => prev.map((x, i) => (pred(x, i) ? { ...x, rot: norm(x.rot + delta) } : x)));

    const selectWhere = (pred: (p: PageState, i: number) => boolean) =>
        setPages((prev) => prev.map((x, i) => ({ ...x, selected: pred(x, i) })));

    const resetAll = () =>
        setPages((prev) => prev.map((x) => ({ ...x, rot: 0, removed: false })));

    const removeSelected = () =>
        setPages((prev) => prev.map((x) => (x.selected ? { ...x, removed: true, selected: false } : x)));

    const selectedCount = useMemo(() => pages.filter((p) => p.selected && !p.removed).length, [pages]);
    const rotatedCount = useMemo(() => pages.filter((p) => !p.removed && p.rot !== 0).length, [pages]);
    const removedCount = useMemo(() => pages.filter((p) => p.removed).length, [pages]);
    const keptCount = pages.length - removedCount;
    const hasChanges = rotatedCount > 0 || removedCount > 0;
    const canRun = !!file && hasChanges && keptCount > 0;

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
            const all = pdf.getPages();
            const total = all.length;

            for (let i = 0; i < total; i++) {
                if (cancelRef.current) return;
                const st = pages[i];
                if (st && !st.removed && st.rot !== 0) {
                    const current = norm(all[i].getRotation().angle);
                    all[i].setRotation(degrees(norm(current + st.rot)));
                }
                if (i % 10 === 0 || i === total - 1) {
                    setMessage(`Rotating page ${i + 1} of ${total}`);
                    setProgress(((i + 1) / total) * 70);
                    await tick();
                }
            }

            const toRemove = pages.map((p, i) => (p.removed ? i : -1)).filter((i) => i >= 0).reverse();
            for (let k = 0; k < toRemove.length; k++) {
                if (cancelRef.current) return;
                pdf.removePage(toRemove[k]);
                if (k % 10 === 0) {
                    setMessage(`Removing page ${k + 1} of ${toRemove.length}`);
                    setProgress(70 + ((k + 1) / toRemove.length) * 20);
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
            setModalError('Failed to rotate the PDF. Please try again.');
            setStatus('error');
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus('idle'); setProgress(0); };
    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const resetPage = () => {
        loadToken.current++;
        setFile(null);
        setPages([]);
        setThumbs({});
        setResult(null);
        setStatus('idle');
        setProgress(0);
        setLoadError(null);
    };

    const safeName = (outName.trim() || 'rotated').replace(/[\\/:*?"<>|]/g, '_');
    const btn = 'px-3 py-2 text-xs sm:text-sm border rounded-lg bg-white hover:bg-gray-100 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl mb-4">
                        <RotateCw className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Rotate PDF Files</h1>
                    <p className="text-gray-600 mt-2">
                        Rotate all pages or just the ones you choose, and remove pages you don’t need.
                    </p>
                </div>

                {!file ? (
                    <FileDropzone onFiles={loadFile} multiple={false} label="Click to select a PDF file" />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-6 h-6 text-teal-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-teal-700 font-medium">
                                        {pages.length} pages · {formatBytes(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={resetPage} className="text-sm text-red-600 hover:underline font-medium shrink-0">
                                Change file
                            </button>
                        </div>

                        <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                            <div>
                                <p className="text-xs font-bold text-gray-600 mb-2">Rotate</p>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className={btn} onClick={() => rotateWhere(-90, () => true)}>
                                        <RotateCcw className="w-4 h-4" /> All left
                                    </button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(90, () => true)}>
                                        <RotateCw className="w-4 h-4" /> All right
                                    </button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(180, () => true)}>
                                        All 180°
                                    </button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(90, (_p, i) => i % 2 === 0)}>
                                        Odd pages ↻
                                    </button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(90, (_p, i) => i % 2 === 1)}>
                                        Even pages ↻
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-600 mb-2">
                                    Selected pages ({selectedCount})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className={btn} onClick={() => selectWhere(() => true)}>Select all</button>
                                    <button type="button" className={btn} onClick={() => selectWhere(() => false)}>Select none</button>
                                    <button type="button" className={btn} onClick={() => selectWhere((_p, i) => i % 2 === 0)}>Odd</button>
                                    <button type="button" className={btn} onClick={() => selectWhere((_p, i) => i % 2 === 1)}>Even</button>
                                    <button type="button" className={btn} disabled={selectedCount === 0} onClick={() => rotateWhere(-90, (p) => p.selected && !p.removed)}>
                                        <RotateCcw className="w-4 h-4" /> Left
                                    </button>
                                    <button type="button" className={btn} disabled={selectedCount === 0} onClick={() => rotateWhere(90, (p) => p.selected && !p.removed)}>
                                        <RotateCw className="w-4 h-4" /> Right
                                    </button>
                                    <button type="button" className={`${btn} text-red-600`} disabled={selectedCount === 0} onClick={removeSelected}>
                                        <Trash2 className="w-4 h-4" /> Remove
                                    </button>
                                    <button type="button" className={btn} disabled={!hasChanges} onClick={resetAll}>
                                        <Eraser className="w-4 h-4" /> Reset all
                                    </button>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pages.map((p, i) => (
                                <div
                                    key={i}
                                    className={`rounded-xl border-2 bg-gray-50 p-2 transition ${p.removed
                                            ? 'border-red-200 opacity-50'
                                            : p.selected
                                                ? 'border-teal-500 ring-2 ring-teal-100'
                                                : 'border-gray-200'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => !p.removed && updatePage(i, { selected: !p.selected })}
                                        className="relative w-full aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden"
                                        aria-label={`Select page ${i + 1}`}
                                    >
                                        {thumbs[i] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={thumbs[i]}
                                                alt={`Page ${i + 1}`}
                                                draggable={false}
                                                className="max-w-[88%] max-h-[88%] object-contain shadow transition-transform duration-300"
                                                style={{ transform: `rotate(${p.rot}deg)` }}
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">Loading…</span>
                                        )}
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">{i + 1}</span>
                                        {p.rot !== 0 && !p.removed && (
                                            <span className="absolute top-1 left-1 text-[10px] bg-teal-600 text-white px-1.5 rounded">{p.rot}°</span>
                                        )}
                                        {p.selected && !p.removed && (
                                            <span className="absolute top-1 right-1 bg-teal-600 text-white rounded-full p-0.5">
                                                <Check className="w-3 h-3" />
                                            </span>
                                        )}
                                        {p.removed && (
                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-600 bg-white/70">
                                                REMOVED
                                            </span>
                                        )}
                                    </button>
                                    <div className="mt-2 flex items-center justify-center gap-1">
                                        {p.removed ? (
                                            <button type="button" onClick={() => updatePage(i, { removed: false })} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 flex items-center gap-1 text-xs" aria-label="Restore">
                                                <Undo2 className="w-4 h-4" /> Restore
                                            </button>
                                        ) : (
                                            <>
                                                <button type="button" onClick={() => rotatePage(i, -90)} className="p-1.5 rounded-lg hover:bg-gray-200" aria-label="Rotate left">
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => rotatePage(i, 90)} className="p-1.5 rounded-lg hover:bg-gray-200" aria-label="Rotate right">
                                                    <RotateCw className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => updatePage(i, { removed: true, selected: false })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove page">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-gray-600">
                            {rotatedCount} rotated · {removedCount} removed · {keptCount} pages in the final PDF
                        </p>
                        {keptCount === 0 && (
                            <p className="text-sm text-red-600">You removed every page. Restore at least one page.</p>
                        )}

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
                                    label="Apply & create PDF"
                                    loadingLabel="Processing..."
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
                title="Rotating your PDF"
                message={message}
                blob={result}
                filename={`${safeName}.pdf`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetPage}
            />

            <ToolSeoContent
                id="rotate-pdf"
                steps={[
                    'Click the upload area to select the PDF with sideways or upside-down pages.',
                    'Use the buttons on each page thumbnail to rotate it left or right, or use the top buttons to rotate all, odd or even pages at once.',
                    'Select several pages by clicking them, then rotate or remove them together. Click Restore to bring back a removed page.',
                    'Click Apply & create PDF and download your corrected file.',
                ]}
            />
        </main>
    );
}