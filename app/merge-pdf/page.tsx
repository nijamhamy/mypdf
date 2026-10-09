'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
    Files, Trash2, ArrowUp, ArrowDown, GripVertical, ChevronDown, ChevronUp,
    ArrowDownAZ, ArrowUpZA, ArrowUpDown, AlertCircle, Check,
} from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import {
    uid, formatBytes, bytesToBlob, parsePageRange, getPdfPageCount, renderPdfThumbnails,
} from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

interface Item {
    id: string;
    file: File;
    pageCount: number;
    range: string;
    expanded: boolean;
    selected: boolean[];
    thumbs: Record<number, string>;
    thumbsStarted: boolean;
    error?: string;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 30));

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

export default function MergePDFPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [outName, setOutName] = useState('merged');
    const [error, setError] = useState<string | null>(null);
    const [dragId, setDragId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const cancelRef = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const update = (id: string, patch: Partial<Item> | ((it: Item) => Partial<Item>)) =>
        setItems((prev) => prev.map((it) =>
            it.id === id ? { ...it, ...(typeof patch === 'function' ? patch(it) : patch) } : it
        ));

    const addFiles = async (files: File[]) => {
        setResult(null);
        setError(null);
        for (const file of files) {
            const id = uid();
            try {
                const pageCount = await getPdfPageCount(file);
                setItems((prev) => [...prev, {
                    id, file, pageCount, range: '', expanded: false,
                    selected: Array(pageCount).fill(true), thumbs: {}, thumbsStarted: false,
                }]);
            } catch {
                setError(`"${file.name}" could not be read. It may be corrupted or password protected.`);
            }
        }
    };

    const toggleExpand = (it: Item) => {
        update(it.id, { expanded: !it.expanded });
        if (!it.thumbsStarted) {
            update(it.id, { thumbsStarted: true, expanded: true });
            renderPdfThumbnails(
                it.file,
                (idx, url) => {
                    if (!mounted.current) return;
                    setItems((prev) => prev.map((x) =>
                        x.id === it.id ? { ...x, thumbs: { ...x.thumbs, [idx]: url } } : x
                    ));
                },
                () => !mounted.current
            ).catch(() => setError('Could not generate page previews.'));
        }
    };

    const setRange = (it: Item, value: string) => {
        const parsed = parsePageRange(value, it.pageCount);
        if (parsed) {
            const sel = Array(it.pageCount).fill(false);
            parsed.forEach((p) => (sel[p] = true));
            update(it.id, { range: value, selected: sel, error: undefined });
        } else {
            update(it.id, { range: value, error: `Use pages 1-${it.pageCount}, e.g. 1-3, 5` });
        }
    };

    const togglePage = (it: Item, idx: number) => {
        const sel = [...it.selected];
        sel[idx] = !sel[idx];
        update(it.id, { selected: sel, range: selectedToRange(sel), error: undefined });
    };

    const setAllPages = (it: Item, value: boolean) => {
        const sel = Array(it.pageCount).fill(value);
        update(it.id, { selected: sel, range: '', error: undefined });
    };

    const move = (index: number, dir: -1 | 1) => {
        setItems((prev) => {
            const next = [...prev];
            const t = index + dir;
            if (t < 0 || t >= next.length) return prev;
            [next[index], next[t]] = [next[t], next[index]];
            return next;
        });
    };

    const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

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
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setDragId(null);
        setOverId(null);
    };

    const totalPages = useMemo(
        () => items.reduce((s, i) => s + i.selected.filter(Boolean).length, 0),
        [items]
    );
    const hasErrors = items.some((i) => i.error);
    const canMerge = items.length > 0 && totalPages > 0 && !hasErrors &&
        (items.length > 1 || totalPages < (items[0]?.pageCount ?? 0));

    const handleMerge = async () => {
        cancelRef.current = false;
        setResult(null);
        setError(null);
        setModalError(null);
        setProgress(0);
        setMessage('Starting...');
        setStatus('processing');
        await tick();

        try {
            const merged = await PDFDocument.create();
            const total = items.length;

            for (let idx = 0; idx < total; idx++) {
                if (cancelRef.current) return;
                const it = items[idx];
                setMessage(`Merging file ${idx + 1} of ${total}: ${it.file.name}`);
                await tick();

                const indices = it.selected.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
                if (indices.length) {
                    const src = await PDFDocument.load(await it.file.arrayBuffer(), { ignoreEncryption: true });
                    const pages = await merged.copyPages(src, indices);
                    pages.forEach((p) => merged.addPage(p));
                }

                setProgress(((idx + 1) / total) * 90);
                await tick();
            }

            if (cancelRef.current) return;
            setMessage('Saving merged PDF...');
            setProgress(95);
            await tick();
            const bytes = await merged.save();

            if (cancelRef.current) return;
            setResult(bytesToBlob(bytes));
            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            setStatus('done');
        } catch (e) {
            console.error(e);
            setModalError('Failed to merge PDFs. Please check your files and try again.');
            setStatus('error');
        }
    };

    const handleCancel = () => {
        cancelRef.current = true;
        setStatus('idle');
        setProgress(0);
    };

    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const reset = () => {
        setItems([]);
        setResult(null);
        setError(null);
        setStatus('idle');
        setProgress(0);
        setOutName('merged');
    };

    const safeName = (outName.trim() || 'merged').replace(/[\\/:*?"<>|]/g, '_');

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 rounded-2xl mb-4">
                        <Files className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        Merge PDF Files Online Free
                    </h1>

                    <p className="text-gray-600 mt-3 max-w-3xl mx-auto">
                        Combine multiple PDF files into one document online for free. Arrange the
                        page order, select only the pages you need, merge invoices, reports, scans
                        or assignments, and download your combined PDF directly from your browser.
                    </p>
                </div>

                {items.length === 0 ? (
                    <FileDropzone onFiles={addFiles} />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Files ({items.length}) · {totalPages} pages selected
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => sortBy('asc')} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                                    <ArrowDownAZ className="w-4 h-4" /> A–Z
                                </button>
                                <button type="button" onClick={() => sortBy('desc')} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                                    <ArrowUpZA className="w-4 h-4" /> Z–A
                                </button>
                                <button type="button" onClick={() => setItems((p) => [...p].reverse())} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                                    <ArrowUpDown className="w-4 h-4" /> Reverse
                                </button>
                                <button type="button" onClick={reset} className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                                    Clear all
                                </button>
                            </div>
                        </div>

                        <ul className="space-y-3">
                            {items.map((it, index) => {
                                const count = it.selected.filter(Boolean).length;
                                return (
                                    <li
                                        key={it.id}
                                        draggable
                                        onDragStart={() => setDragId(it.id)}
                                        onDragOver={(e) => { e.preventDefault(); setOverId(it.id); }}
                                        onDragEnd={() => { setDragId(null); setOverId(null); }}
                                        onDrop={() => onDrop(it.id)}
                                        className={`rounded-xl border bg-gray-50 transition ${overId === it.id && dragId !== it.id ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
                                            } ${dragId === it.id ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex flex-wrap items-center gap-3 p-3">
                                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab shrink-0" />
                                            <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{it.file.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatBytes(it.file.size)} · {it.pageCount} pages · using {count}
                                                </p>
                                            </div>
                                            <input
                                                value={it.range}
                                                onChange={(e) => setRange(it, e.target.value)}
                                                placeholder="All pages (e.g. 1-3, 5)"
                                                className={`w-44 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${it.error ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Move up">
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30" aria-label="Move down">
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => toggleExpand(it)} className="p-2 rounded-lg hover:bg-gray-200" aria-label="Toggle pages">
                                                    {it.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <button type="button" onClick={() => remove(it.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {it.error && <p className="px-4 pb-2 text-xs text-red-600">{it.error}</p>}

                                        {it.expanded && (
                                            <div className="border-t border-gray-200 p-4">
                                                <div className="flex gap-2 mb-3">
                                                    <button type="button" onClick={() => setAllPages(it, true)} className="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-gray-100">Select all</button>
                                                    <button type="button" onClick={() => setAllPages(it, false)} className="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-gray-100">Select none</button>
                                                </div>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                                                    {it.selected.map((on, i) => (
                                                        <button
                                                            type="button"
                                                            key={i}
                                                            onClick={() => togglePage(it, i)}
                                                            className={`relative rounded-lg border-2 overflow-hidden bg-white aspect-[3/4] flex items-center justify-center ${on ? 'border-red-500' : 'border-gray-200 opacity-50'
                                                                }`}
                                                        >
                                                            {it.thumbs[i] ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={it.thumbs[i]} alt={`Page ${i + 1}`} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-xs text-gray-400">Loading…</span>
                                                            )}
                                                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">{i + 1}</span>
                                                            {on && (
                                                                <span className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5">
                                                                    <Check className="w-3 h-3" />
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="mt-4">
                            <FileDropzone onFiles={addFiles} compact label="Add more PDF files" />
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
                                    onClick={handleMerge}
                                    loading={status === 'processing'}
                                    disabled={!canMerge}
                                    label={`Merge ${totalPages} pages`}
                                    loadingLabel="Merging..."
                                />
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="mt-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
                    </div>
                )}
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Merging your PDFs"
                message={message}
                blob={result}
                filename={`${safeName}.pdf`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={reset}
            />

            <ToolSeoContent
                id="merge-pdf"
                steps={[
                    'Click the upload area or drag and drop the PDF files you want to combine.',
                    'Drag files to change their order, or use A–Z, Z–A or Reverse sorting.',
                    'Open a file to preview its pages, select only the pages you need, or enter a range such as 1-3, 5.',
                    'Enter a name for your merged PDF and click Merge.',
                    'Download your combined PDF. Your files are processed in your browser and are not uploaded.',
                ]}
            />
        </main >
    );
}