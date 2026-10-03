'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Scissors, FileText, AlertCircle, Check } from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import { formatBytes, bytesToBlob, parsePageRange, renderPdfThumbnails } from '@/lib/pdf-utils';

type Mode = 'extract' | 'delete' | 'ranges' | 'every';

interface Part {
    label: string;
    indices: number[];
}

const MODES: { key: Mode; title: string; desc: string }[] = [
    { key: 'extract', title: 'Extract pages', desc: 'Pick pages and save them as one PDF' },
    { key: 'delete', title: 'Delete pages', desc: 'Remove pages and keep the rest' },
    { key: 'ranges', title: 'Split by ranges', desc: 'Each range becomes its own PDF' },
    { key: 'every', title: 'Split every N pages', desc: 'Cut into equal parts' },
];

const tick = () => new Promise<void>((r) => setTimeout(r, 20));

function selectedToRange(sel: boolean[]): string {
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

function parseRangeGroups(text: string, total: number): number[][] | null {
    const groups: number[][] = [];
    for (const raw of text.split(',')) {
        const p = raw.trim();
        if (!p) continue;
        const m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!m) return null;
        const a = parseInt(m[1], 10);
        const b = m[2] ? parseInt(m[2], 10) : a;
        if (a < 1 || b > total || a > b) return null;
        const g: number[] = [];
        for (let i = a; i <= b; i++) g.push(i - 1);
        groups.push(g);
    }
    return groups.length ? groups : null;
}

function describe(indices: number[]): string {
    if (indices.length === 0) return '';
    const first = indices[0] + 1;
    const last = indices[indices.length - 1] + 1;
    const contiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
    if (indices.length === 1) return `page ${first}`;
    return contiguous ? `pages ${first}-${last}` : `${indices.length} pages`;
}

export default function SplitPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [selected, setSelected] = useState<boolean[]>([]);
    const [pageRange, setPageRange] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);

    const [mode, setMode] = useState<Mode>('extract');
    const [rangesText, setRangesText] = useState('');
    const [everyN, setEveryN] = useState(1);
    const [outName, setOutName] = useState('split');

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [resultName, setResultName] = useState('split.pdf');
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
            setPageCount(count);
            setSelected(Array(count).fill(false));
            setPageRange('');
            setRangesText('');
            setEveryN(1);
            setOutName((f.name.replace(/\.pdf$/i, '') || 'split') + '-split');
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

    const pageRangeInvalid = pageRange.trim() !== '' && parsePageRange(pageRange, pageCount) === null;

    const onPageRangeChange = (value: string) => {
        setPageRange(value);
        if (value.trim() === '') { setSelected(Array(pageCount).fill(false)); return; }
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
        setPageRange(selectedToRange(sel));
    };

    const setAll = (v: boolean) => {
        setSelected(Array(pageCount).fill(v));
        setPageRange(v ? `1-${pageCount}` : '');
    };

    const selectedIdx = useMemo(
        () => selected.map((s, i) => (s ? i : -1)).filter((i) => i >= 0),
        [selected]
    );

    const { parts, planError } = useMemo((): { parts: Part[]; planError: string | null } => {
        if (!pageCount) return { parts: [], planError: null };

        if (mode === 'extract') {
            if (pageRangeInvalid) return { parts: [], planError: `Use pages from 1 to ${pageCount}, e.g. 1-3, 5.` };
            if (selectedIdx.length === 0) return { parts: [], planError: null };
            return { parts: [{ label: describe(selectedIdx), indices: selectedIdx }], planError: null };
        }

        if (mode === 'delete') {
            if (pageRangeInvalid) return { parts: [], planError: `Use pages from 1 to ${pageCount}, e.g. 1-3, 5.` };
            if (selectedIdx.length === 0) return { parts: [], planError: null };
            if (selectedIdx.length >= pageCount) return { parts: [], planError: 'You cannot delete every page.' };
            const keep = Array.from({ length: pageCount }, (_, i) => i).filter((i) => !selected[i]);
            return { parts: [{ label: `${keep.length} pages kept`, indices: keep }], planError: null };
        }

        if (mode === 'ranges') {
            if (rangesText.trim() === '') return { parts: [], planError: null };
            const groups = parseRangeGroups(rangesText, pageCount);
            if (!groups) return { parts: [], planError: `Enter ranges between 1 and ${pageCount}, like 1-3, 4-6, 8.` };
            return { parts: groups.map((g) => ({ label: describe(g), indices: g })), planError: null };
        }

        const n = Math.max(1, Math.min(everyN || 1, pageCount));
        const out: Part[] = [];
        for (let i = 0; i < pageCount; i += n) {
            const g: number[] = [];
            for (let j = i; j < Math.min(i + n, pageCount); j++) g.push(j);
            out.push({ label: describe(g), indices: g });
        }
        return { parts: out, planError: null };
    }, [mode, pageCount, selectedIdx, selected, pageRangeInvalid, rangesText, everyN]);

    const canRun = !!file && parts.length > 0 && !planError;
    const showGrid = mode === 'extract' || mode === 'delete';

    const handleRun = async () => {
        if (!file || parts.length === 0) return;
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(0);
        setMessage('Loading PDF...');
        setStatus('processing');
        await tick();

        try {
            const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
            const base = (outName.trim() || 'split').replace(/[\\/:*?"<>|]/g, '_');
            const pad = String(parts.length).length;
            const multi = parts.length > 1;
            const outputs: { name: string; blob: Blob }[] = [];

            for (let k = 0; k < parts.length; k++) {
                if (cancelRef.current) return;
                setMessage(multi ? `Creating file ${k + 1} of ${parts.length}` : 'Copying pages...');
                await tick();

                const doc = await PDFDocument.create();
                const copied = await doc.copyPages(src, parts[k].indices);
                copied.forEach((p) => doc.addPage(p));
                const bytes = await doc.save();

                outputs.push({
                    name: multi ? `${base}-part-${String(k + 1).padStart(pad, '0')}.pdf` : `${base}.pdf`,
                    blob: bytesToBlob(bytes),
                });
                setProgress(((k + 1) / parts.length) * (multi ? 85 : 95));
            }

            if (cancelRef.current) return;

            if (outputs.length === 1) {
                setResult(outputs[0].blob);
                setResultName(outputs[0].name);
            } else {
                setMessage('Creating ZIP file...');
                await tick();
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                outputs.forEach((o) => zip.file(o.name, o.blob));
                const zipBlob = await zip.generateAsync(
                    { type: 'blob', compression: 'STORE' },
                    (meta) => { if (!cancelRef.current) setProgress(85 + (meta.percent / 100) * 14); }
                );
                if (cancelRef.current) return;
                setResult(zipBlob);
                setResultName(`${base}.zip`);
            }

            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            setStatus('done');
        } catch (e) {
            console.error(e);
            setModalError('Failed to split the PDF. Please try again.');
            setStatus('error');
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
        setPageRange('');
        setResult(null);
        setStatus('idle');
        setProgress(0);
        setLoadError(null);
    };

    const inputCls = 'px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
    const ctaLabel =
        parts.length > 1 ? `Split into ${parts.length} PDFs (ZIP)` :
            mode === 'delete' ? 'Delete pages & save PDF' : 'Create PDF';

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                        <Scissors className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Split PDF File</h1>
                    <p className="text-gray-600 mt-2">
                        Extract pages, delete pages, or cut your PDF into several files.
                    </p>
                </div>

                {!file ? (
                    <FileDropzone onFiles={loadFile} multiple={false} label="Click to select a PDF file" />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-blue-700 font-medium">
                                        {pageCount} pages · {formatBytes(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-600 hover:underline font-medium shrink-0">
                                Change file
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {MODES.map((m) => (
                                <button
                                    type="button"
                                    key={m.key}
                                    onClick={() => setMode(m.key)}
                                    className={`text-left p-3 rounded-xl border-2 transition ${mode === m.key
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <p className="text-sm font-bold text-gray-800">{m.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                                </button>
                            ))}
                        </div>

                        {showGrid && (
                            <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                    <h4 className="text-sm font-bold text-gray-800">
                                        {mode === 'extract' ? 'Pages to extract' : 'Pages to delete'} ({selectedIdx.length} selected)
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            value={pageRange}
                                            onChange={(e) => onPageRangeChange(e.target.value)}
                                            placeholder="e.g. 1-3, 5, 8-10"
                                            className={`${inputCls} w-48 ${pageRangeInvalid ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        <button type="button" onClick={() => setAll(true)} className="px-3 py-1.5 text-xs border rounded-lg bg-white hover:bg-gray-100">Select all</button>
                                        <button type="button" onClick={() => setAll(false)} className="px-3 py-1.5 text-xs border rounded-lg bg-white hover:bg-gray-100">Select none</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
                                    {selected.map((on, i) => (
                                        <button
                                            type="button"
                                            key={i}
                                            onClick={() => togglePage(i)}
                                            className={`relative rounded-lg border-2 overflow-hidden bg-white aspect-[3/4] flex items-center justify-center ${on
                                                    ? mode === 'delete' ? 'border-red-500' : 'border-blue-500'
                                                    : 'border-gray-200'
                                                } ${on && mode === 'delete' ? 'opacity-50' : ''}`}
                                        >
                                            {thumbs[i] ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={thumbs[i]} alt={`Page ${i + 1}`} className="w-full h-full object-contain" draggable={false} />
                                            ) : (
                                                <span className="text-xs text-gray-400">Loading…</span>
                                            )}
                                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">{i + 1}</span>
                                            {on && (
                                                <span className={`absolute top-1 right-1 text-white rounded-full p-0.5 ${mode === 'delete' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                                    <Check className="w-3 h-3" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {mode === 'ranges' && (
                            <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    Ranges — separate with commas (each range becomes one PDF)
                                </label>
                                <input
                                    value={rangesText}
                                    onChange={(e) => setRangesText(e.target.value)}
                                    placeholder="e.g. 1-3, 4-6, 8"
                                    className={`${inputCls} w-full ${planError ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {[
                                        { label: 'First half / second half', v: `1-${Math.ceil(pageCount / 2)}, ${Math.ceil(pageCount / 2) + 1}-${pageCount}` },
                                        { label: 'Page 1 / rest', v: pageCount > 1 ? `1, 2-${pageCount}` : '1' },
                                    ].map((s) => (
                                        <button
                                            type="button"
                                            key={s.label}
                                            onClick={() => setRangesText(s.v)}
                                            className="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-gray-100"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {mode === 'every' && (
                            <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                                <label className="block text-sm font-bold text-gray-800 mb-2">Pages per file</label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="number" min={1} max={pageCount} value={everyN}
                                        onChange={(e) => setEveryN(Math.max(1, Math.min(pageCount, parseInt(e.target.value || '1', 10))))}
                                        className={`${inputCls} w-28 border-gray-300`}
                                    />
                                    <div className="flex gap-2">
                                        {[1, 2, 5, 10].filter((n) => n <= pageCount).map((n) => (
                                            <button
                                                type="button"
                                                key={n}
                                                onClick={() => setEveryN(n)}
                                                className={`px-3 py-1 text-xs border rounded-lg ${everyN === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-100'}`}
                                            >
                                                {n === 1 ? 'Every page' : `Every ${n}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {planError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" /> <span>{planError}</span>
                            </div>
                        )}

                        {parts.length > 0 && (
                            <section className="p-4 rounded-2xl border border-gray-200 bg-white">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">
                                    Result: {parts.length} {parts.length === 1 ? 'PDF file' : 'PDF files in a ZIP'}
                                </h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                    {parts.slice(0, 60).map((p, k) => (
                                        <li key={k} className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                            <span className="font-semibold">{parts.length > 1 ? `Part ${k + 1}` : 'File'}</span> · {p.label}
                                            <span className="text-gray-400"> · {p.indices.length} {p.indices.length === 1 ? 'page' : 'pages'}</span>
                                        </li>
                                    ))}
                                </ul>
                                {parts.length > 60 && (
                                    <p className="text-xs text-gray-500 mt-2">+ {parts.length - 60} more files</p>
                                )}
                            </section>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden sm:w-72">
                                <input
                                    value={outName}
                                    onChange={(e) => setOutName(e.target.value)}
                                    className="flex-1 px-3 py-3 text-sm focus:outline-none min-w-0"
                                    placeholder="File name"
                                />
                                <span className="px-3 text-sm text-gray-500 bg-gray-50 py-3">{parts.length > 1 ? '.zip' : '.pdf'}</span>
                            </div>
                            <div className="flex-1">
                                <ProcessButton
                                    onClick={handleRun}
                                    loading={status === 'processing'}
                                    disabled={!canRun}
                                    label={ctaLabel}
                                    loadingLabel="Splitting..."
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
                title="Splitting your PDF"
                message={message}
                blob={result}
                filename={resultName}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />
        </main>
    );
}