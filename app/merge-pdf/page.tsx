"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { PDFDocument } from "pdf-lib";
import {
    AlertCircle,
    ArrowDown,
    ArrowDownAZ,
    ArrowUp,
    ArrowUpAZ,
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronUp,
    Files,
    GripVertical,
    ShieldCheck,
    Trash2,
} from "lucide-react";
import FileDropzone from "@/components/pdf/FileDropzone";
import ProcessButton from "@/components/pdf/ProcessButton";
import ProcessingModal, { ProcessStatus } from "@/components/pdf/ProcessingModal";
import {
    uid,
    formatBytes,
    bytesToBlob,
    parsePageRange,
    getPdfPageCount,
    renderPdfThumbnails,
} from "@/lib/pdf-utils";
import ToolSeoContent from "@/components/ToolSeoContent";

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

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

function selectedToRange(selected: boolean[]): string {
    if (selected.length > 0 && selected.every(Boolean)) return "";
    const ranges: string[] = [];
    let index = 0;
    while (index < selected.length) {
        if (!selected[index]) {
            index++;
            continue;
        }
        let end = index;
        while (end + 1 < selected.length && selected[end + 1]) end++;
        ranges.push(index === end ? `${index + 1}` : `${index + 1}-${end + 1}`);
        index = end + 1;
    }
    return ranges.join(", ");
}

function safePdfName(value: string): string {
    const cleaned = value.trim().replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "_");
    return `${cleaned || "merged"}.pdf`;
}

export default function MergePDFPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [outName, setOutName] = useState("merged");
    const [error, setError] = useState<string | null>(null);
    const [dragId, setDragId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [status, setStatus] = useState<ProcessStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [resultInfo, setResultInfo] = useState<{ size: number; pageCount: number } | null>(null);
    const cancelRef = useRef(false);
    const mountedRef = useRef(false);
    const previewUrlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            previewUrlsRef.current.clear();
        };
    }, []);

    const update = (id: string, patch: Partial<Item> | ((item: Item) => Partial<Item>)) => {
        setItems((previous) => previous.map((item) =>
            item.id === id
                ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) }
                : item
        ));
    };

    const addFiles = async (files: File[]) => {
        setResult(null);
        setResultInfo(null);
        setError(null);

        for (const file of files) {
            const id = uid();
            const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
            if (!isPdf) {
                setError(`“${file.name}” is not a PDF. Choose a .pdf file.`);
                continue;
            }
            try {
                const pageCount = await getPdfPageCount(file);
                if (!mountedRef.current) return;
                setItems((previous) => [...previous, {
                    id,
                    file,
                    pageCount,
                    range: "",
                    expanded: false,
                    selected: Array(pageCount).fill(true),
                    thumbs: {},
                    thumbsStarted: false,
                }]);
            } catch {
                setError(`“${file.name}” could not be read. It may be damaged or password-protected. Password-protected PDFs are not supported by this tool.`);
            }
        }
    };

    const toggleExpand = (item: Item) => {
        const shouldExpand = !item.expanded;
        update(item.id, { expanded: shouldExpand });
        if (item.thumbsStarted) return;

        update(item.id, { thumbsStarted: true, expanded: true });
        renderPdfThumbnails(
            item.file,
            (index, url) => {
                if (!mountedRef.current) {
                    URL.revokeObjectURL(url);
                    return;
                }
                previewUrlsRef.current.add(url);
                setItems((previous) => previous.map((current) =>
                    current.id === item.id
                        ? { ...current, thumbs: { ...current.thumbs, [index]: url } }
                        : current
                ));
            },
            () => !mountedRef.current
        ).catch(() => {
            if (mountedRef.current) setError(`Page previews could not be generated for “${item.file.name}”. You can still merge it.`);
        });
    };

    const setRange = (item: Item, value: string) => {
        if (value.trim() === "") {
            update(item.id, { range: "", selected: Array(item.pageCount).fill(true), error: undefined });
            return;
        }
        const parsed = parsePageRange(value, item.pageCount);
        if (parsed) {
            const selected = Array(item.pageCount).fill(false);
            parsed.forEach((pageIndex) => { selected[pageIndex] = true; });
            update(item.id, { range: value, selected, error: undefined });
        } else {
            update(item.id, { range: value, error: `Enter page numbers from 1 to ${item.pageCount}, for example 1-3, 5.` });
        }
    };

    const togglePage = (item: Item, index: number) => {
        const selected = [...item.selected];
        selected[index] = !selected[index];
        update(item.id, { selected, range: selectedToRange(selected), error: undefined });
    };

    const setAllPages = (item: Item, value: boolean) => {
        update(item.id, { selected: Array(item.pageCount).fill(value), range: "", error: undefined });
    };

    const move = (index: number, direction: -1 | 1) => {
        setItems((previous) => {
            const next = [...previous];
            const target = index + direction;
            if (target < 0 || target >= next.length) return previous;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const remove = (id: string) => {
        const item = items.find((current) => current.id === id);
        item && Object.values(item.thumbs).forEach((url) => {
            URL.revokeObjectURL(url);
            previewUrlsRef.current.delete(url);
        });
        setItems((previous) => previous.filter((current) => current.id !== id));
        setResult(null);
        setResultInfo(null);
    };

    const sortBy = (direction: "asc" | "desc") => {
        setItems((previous) => [...previous].sort((a, b) => {
            const order = a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" });
            return direction === "asc" ? order : -order;
        }));
    };

    const onDrop = (targetId: string) => {
        if (!dragId || dragId === targetId) return;
        setItems((previous) => {
            const from = previous.findIndex((item) => item.id === dragId);
            const to = previous.findIndex((item) => item.id === targetId);
            if (from < 0 || to < 0) return previous;
            const next = [...previous];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setDragId(null);
        setOverId(null);
    };

    const totalSelectedPages = useMemo(
        () => items.reduce((sum, item) => sum + item.selected.filter(Boolean).length, 0),
        [items]
    );
    const hasItemErrors = items.some((item) => Boolean(item.error));
    const hasUnfinishedRange = items.some((item) => Boolean(item.error));
    const canMerge = items.length > 0 && totalSelectedPages > 0 && !hasUnfinishedRange;

    const handleMerge = async () => {
        if (!canMerge || status === "processing") return;
        cancelRef.current = false;
        setResult(null);
        setResultInfo(null);
        setError(null);
        setModalError(null);
        setProgress(0);
        setMessage("Preparing selected pages...");
        setStatus("processing");
        await tick();

        try {
            const output = await PDFDocument.create();
            const sourceFiles = items.filter((item) => item.selected.some(Boolean));
            const totalFiles = sourceFiles.length;
            let copiedPageCount = 0;

            for (let index = 0; index < sourceFiles.length; index++) {
                if (cancelRef.current) return;
                const item = sourceFiles[index];
                const pageIndexes = item.selected
                    .map((isSelected, pageIndex) => isSelected ? pageIndex : -1)
                    .filter((pageIndex) => pageIndex >= 0);

                setMessage(`Adding selected pages from file ${index + 1} of ${totalFiles}: ${item.file.name}`);
                await tick();

                // Do not use ignoreEncryption:true: pdf-lib cannot decrypt encrypted files.
                const source = await PDFDocument.load(await item.file.arrayBuffer());
                const copiedPages = await output.copyPages(source, pageIndexes);
                copiedPages.forEach((page) => output.addPage(page));
                copiedPageCount += copiedPages.length;
                setProgress(((index + 1) / totalFiles) * 85);
                await tick();
            }

            if (cancelRef.current) return;
            if (copiedPageCount === 0) throw new Error("No pages were selected.");

            setMessage("Saving the merged PDF...");
            setProgress(92);
            await tick();
            const bytes = await output.save();
            if (cancelRef.current) return;

            const blob = bytesToBlob(bytes);
            setResult(blob);
            setResultInfo({ size: blob.size, pageCount: copiedPageCount });
            setProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 350));
            if (mountedRef.current && !cancelRef.current) setStatus("done");
        } catch (caught) {
            console.error("PDF merge failed:", caught);
            setModalError(
                caught instanceof Error && caught.message === "No pages were selected."
                    ? caught.message
                    : "Merging failed. A PDF may be damaged, password-protected, or use unsupported features. Check the files and try again."
            );
            setStatus("error");
        }
    };

    const handleCancel = () => {
        cancelRef.current = true;
        setStatus("idle");
        setProgress(0);
    };

    const closeModal = () => {
        setStatus("idle");
        setModalError(null);
    };

    const reset = () => {
        cancelRef.current = true;
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current.clear();
        setItems([]);
        setResult(null);
        setResultInfo(null);
        setError(null);
        setStatus("idle");
        setProgress(0);
        setMessage("");
        setModalError(null);
        setOutName("merged");
        setDragId(null);
        setOverId(null);
    };

    const safeName = safePdfName(outName);

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                <header className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                        <Files className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Merge PDF Files Online</h1>
                    <p className="mx-auto mt-3 max-w-3xl leading-relaxed text-gray-600">
                        Combine selected pages from multiple PDFs into one file. Arrange documents in the final order, preview page thumbnails, and include only the pages you need. This tool processes files in your browser; it does not upload them to our server for merging.
                    </p>
                </header>

                <section aria-labelledby="merge-tool-heading">
                    <h2 id="merge-tool-heading" className="sr-only">Select and arrange PDF files to merge</h2>
                    {items.length === 0 ? (
                        <div>
                            <FileDropzone onFiles={addFiles} />
                            <p className="mt-3 text-center text-sm text-gray-500">Add two or more PDFs to combine documents. You can also select pages from a single PDF to create a smaller PDF.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Merge order and page selection</h2>
                                    <p className="text-sm text-gray-600">{items.length} {items.length === 1 ? "file" : "files"} · {totalSelectedPages} selected {totalSelectedPages === 1 ? "page" : "pages"}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => sortBy("asc")} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50" aria-label="Sort files A to Z">
                                        <ArrowDownAZ className="h-4 w-4" /> A–Z
                                    </button>
                                    <button type="button" onClick={() => sortBy("desc")} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50" aria-label="Sort files Z to A">
                                        <ArrowUpAZ className="h-4 w-4" /> Z–A
                                    </button>
                                    <button type="button" onClick={() => setItems((previous) => [...previous].reverse())} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50" aria-label="Reverse file order">
                                        <ArrowUpDown className="h-4 w-4" /> Reverse
                                    </button>
                                    <button type="button" onClick={reset} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">Clear all</button>
                                </div>
                            </div>

                            <ol className="space-y-3" aria-label="PDF merge order">
                                {items.map((item, index) => {
                                    const selectedCount = item.selected.filter(Boolean).length;
                                    return (
                                        <li
                                            key={item.id}
                                            draggable
                                            onDragStart={(event) => {
                                                event.dataTransfer.effectAllowed = "move";
                                                setDragId(item.id);
                                            }}
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                event.dataTransfer.dropEffect = "move";
                                                setOverId(item.id);
                                            }}
                                            onDragEnd={() => {
                                                setDragId(null);
                                                setOverId(null);
                                            }}
                                            onDrop={(event) => {
                                                event.preventDefault();
                                                onDrop(item.id);
                                            }}
                                            className={`rounded-xl border bg-gray-50 transition ${overId === item.id && dragId !== item.id ? "border-red-500 ring-2 ring-red-200" : "border-gray-200"} ${dragId === item.id ? "opacity-50" : ""}`}
                                        >
                                            <div className="flex flex-wrap items-center gap-3 p-3">
                                                <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-gray-400" aria-hidden="true" />
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-800">{index + 1}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-gray-800">{item.file.name}</p>
                                                    <p className="text-xs text-gray-600">{formatBytes(item.file.size)} · {item.pageCount} {item.pageCount === 1 ? "page" : "pages"} · {selectedCount} selected</p>
                                                </div>
                                                <label className="sr-only" htmlFor={`range-${item.id}`}>Pages to include from {item.file.name}</label>
                                                <input
                                                    id={`range-${item.id}`}
                                                    value={item.range}
                                                    onChange={(event) => setRange(item, event.target.value)}
                                                    placeholder={`All pages (e.g. 1-${Math.min(3, item.pageCount)}, 5)`}
                                                    aria-invalid={Boolean(item.error)}
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 sm:w-52 ${item.error ? "border-red-500" : "border-gray-300"}`}
                                                />
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg p-2 hover:bg-gray-200 disabled:opacity-30" aria-label={`Move ${item.file.name} up`}><ArrowUp className="h-4 w-4" /></button>
                                                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="rounded-lg p-2 hover:bg-gray-200 disabled:opacity-30" aria-label={`Move ${item.file.name} down`}><ArrowDown className="h-4 w-4" /></button>
                                                    <button type="button" onClick={() => toggleExpand(item)} className="rounded-lg p-2 hover:bg-gray-200" aria-label={`${item.expanded ? "Hide" : "Preview"} pages in ${item.file.name}`} aria-expanded={item.expanded}>{item.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                                                    <button type="button" onClick={() => remove(item.id)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${item.file.name}`}><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>

                                            {item.error && <p className="px-4 pb-3 text-sm text-red-700" role="alert">{item.error}</p>}

                                            {item.expanded && (
                                                <div className="border-t border-gray-200 p-4">
                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => setAllPages(item, true)} className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-gray-100">Include all pages</button>
                                                        <button type="button" onClick={() => setAllPages(item, false)} className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-gray-100">Clear page selection</button>
                                                    </div>
                                                    <p className="mb-3 text-xs text-gray-600">Select the pages to include. Selected pages are copied in their original order.</p>
                                                    <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
                                                        {item.selected.map((isSelected, pageIndex) => (
                                                            <button
                                                                type="button"
                                                                key={pageIndex}
                                                                onClick={() => togglePage(item, pageIndex)}
                                                                aria-pressed={isSelected}
                                                                aria-label={`${isSelected ? "Exclude" : "Include"} page ${pageIndex + 1} from ${item.file.name}`}
                                                                className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border-2 bg-white ${isSelected ? "border-red-600" : "border-gray-200 opacity-60"}`}
                                                            >
                                                                {item.thumbs[pageIndex] ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={item.thumbs[pageIndex]} alt={`Preview of page ${pageIndex + 1}`} className="h-full w-full object-contain" />
                                                                ) : (
                                                                    <span className="px-2 text-center text-xs text-gray-500">Preview unavailable</span>
                                                                )}
                                                                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">Page {pageIndex + 1}</span>
                                                                {isSelected && <span className="absolute right-1 top-1 rounded-full bg-red-700 p-0.5 text-white"><Check className="h-3 w-3" /></span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>

                            <div className="mt-4">
                                <FileDropzone onFiles={addFiles} compact label="Add more PDF files" />
                            </div>

                            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
                                <h3 className="font-semibold">What gets included in the merged file?</h3>
                                <p className="mt-1">Files are combined in the displayed order. Within each file, selected pages follow their original page order. Use the page-range field or thumbnails to exclude pages before merging. The output is a new PDF; keep your original files until you have checked it.</p>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="sr-only" htmlFor="merged-file-name">Output PDF file name</label>
                                <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 sm:w-72">
                                    <input id="merged-file-name" value={outName} onChange={(event) => setOutName(event.target.value)} className="min-w-0 flex-1 px-3 py-3 text-sm focus:outline-none" placeholder="File name" />
                                    <span className="bg-gray-50 px-3 py-3 text-sm text-gray-600">.pdf</span>
                                </div>
                                <div className="flex-1">
                                    <ProcessButton onClick={handleMerge} loading={status === "processing"} disabled={!canMerge} label={`Merge ${totalSelectedPages} selected ${totalSelectedPages === 1 ? "page" : "pages"}`} loadingLabel="Merging PDFs…" />
                                </div>
                            </div>
                        </>
                    )}

                    {error && <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertCircle className="h-5 w-5 shrink-0" /><span>{error}</span></div>}
                </section>

                {resultInfo && status === "done" && (
                    <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4" aria-live="polite">
                        <h2 className="font-semibold text-green-950">Merged PDF is ready</h2>
                        <p className="mt-1 text-sm text-green-900">The output contains {resultInfo.pageCount} selected pages and is {formatBytes(resultInfo.size)}.</p>
                        <p className="mt-1 text-xs text-green-900">Open the downloaded PDF and check its page order and content before sharing it.</p>
                    </section>
                )}

                <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
                    <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p><strong>Privacy:</strong> PDF files are read and merged in your browser. This operation does not upload the selected documents to our server. Password-protected or damaged PDFs may fail; this tool does not remove PDF passwords.</p></div>
                </aside>
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Merging selected PDF pages"
                message={message}
                blob={result}
                filename={safeName}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={reset}
            />

            <ToolSeoContent
                id="merge-pdf"
                steps={[
                    "Choose two or more PDF files, or choose one PDF if you only want to extract selected pages into a new file.",
                    "Arrange files in the desired final order by dragging a file or using the move, sort, or reverse controls.",
                    "Enter a page range such as 1-3, 5, or open the page preview and select the pages to include. Leave the range blank to include every page in that file.",
                    "Review the file order and selected-page count, then enter a name for the output PDF.",
                    "Select Merge and download the result. Open it and check the page order before using or sharing it.",
                ]}
            />
        </main>
    );
}
