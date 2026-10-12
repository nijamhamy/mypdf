"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import {
    AlertCircle, Check, Eraser, FileText, RotateCcw, RotateCw, ShieldCheck, Trash2, Undo2,
} from "lucide-react";
import FileDropzone from "@/components/pdf/FileDropzone";
import ProcessButton from "@/components/pdf/ProcessButton";
import ProcessingModal, { ProcessStatus } from "@/components/pdf/ProcessingModal";
import { formatBytes, bytesToBlob, renderPdfThumbnails } from "@/lib/pdf-utils";
import ToolSeoContent from "@/components/ToolSeoContent";

interface PageState {
    rot: number;
    removed: boolean;
    selected: boolean;
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));
const norm = (a: number) => ((a % 360) + 360) % 360;

function safeBaseName(value: string): string {
    return value.trim().replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "_") || "rotated";
}

export default function RotatePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageState[]>([]);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [outName, setOutName] = useState("rotated");

    const [status, setStatus] = useState<ProcessStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [resultInfo, setResultInfo] = useState<{ pages: number; size: number } | null>(null);

    const cancelRef = useRef(false);
    const mounted = useRef(false);
    const loadToken = useRef(0);
    const previewUrls = useRef<Set<string>>(new Set());

    useEffect(() => {
        mounted.current = true;
        const urls = previewUrls.current;
        return () => {
            mounted.current = false;
            loadToken.current++;
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    const loadFile = async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
            setLoadError("Choose a PDF file (.pdf). Other file types are not supported.");
            return;
        }
        const token = ++loadToken.current;
        setLoadError(null);
        setThumbs({});
        setResult(null);
        setResultInfo(null);
        try {
            const doc = await PDFDocument.load(await f.arrayBuffer());
            if (!mounted.current || token !== loadToken.current) return;
            const count = doc.getPageCount();
            if (count < 1) throw new Error("The PDF has no pages.");
            setFile(f);
            setPages(Array.from({ length: count }, () => ({ rot: 0, removed: false, selected: false })));
            setOutName(safeBaseName(f.name) + "-rotated");
            renderPdfThumbnails(
                f,
                (idx, url) => {
                    if (!mounted.current || token !== loadToken.current) { URL.revokeObjectURL(url); return; }
                    previewUrls.current.add(url);
                    setThumbs((prev) => ({ ...prev, [idx]: url }));
                },
                () => !mounted.current || token !== loadToken.current,
                170
            ).catch(() => {
                if (mounted.current && token === loadToken.current) setLoadError("Page previews could not be generated. You can still rotate pages, but you will not see them.");
            });
        } catch (error) {
            console.error("PDF load failed:", error);
            if (mounted.current && token === loadToken.current) {
                setFile(null);
                setPages([]);
                setLoadError("This PDF could not be opened. It may be damaged or password-protected. This tool cannot unlock protected PDFs.");
            }
        }
    };

    const updatePage = (i: number, p: Partial<PageState>) =>
        setPages((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...p } : x)));

    const rotatePage = (i: number, delta: number) =>
        setPages((prev) => prev.map((x, idx) => (idx === i ? { ...x, rot: norm(x.rot + delta) } : x)));

    const rotateWhere = (delta: number, pred: (p: PageState, i: number) => boolean) =>
        setPages((prev) => prev.map((x, i) => (!x.removed && pred(x, i) ? { ...x, rot: norm(x.rot + delta) } : x)));

    const selectWhere = (pred: (p: PageState, i: number) => boolean) =>
        setPages((prev) => prev.map((x, i) => ({ ...x, selected: !x.removed && pred(x, i) })));

    const resetEdits = () =>
        setPages((prev) => prev.map((x) => ({ ...x, rot: 0, removed: false })));

    const removeSelected = () =>
        setPages((prev) => prev.map((x) => (x.selected ? { ...x, removed: true, selected: false } : x)));

    const selectedCount = useMemo(() => pages.filter((p) => p.selected && !p.removed).length, [pages]);
    const rotatedCount = useMemo(() => pages.filter((p) => !p.removed && p.rot !== 0).length, [pages]);
    const removedCount = useMemo(() => pages.filter((p) => p.removed).length, [pages]);
    const keptCount = pages.length - removedCount;
    const hasChanges = rotatedCount > 0 || removedCount > 0;
    const canRun = Boolean(file) && hasChanges && keptCount > 0 && status !== "processing";

    const handleApply = async () => {
        if (!file || !canRun) return;
        cancelRef.current = false;
        setResult(null);
        setResultInfo(null);
        setModalError(null);
        setProgress(0);
        setMessage("Opening the PDF...");
        setStatus("processing");
        await tick();

        try {
            const pdf = await PDFDocument.load(await file.arrayBuffer());
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
            setMessage("Saving the PDF...");
            setProgress(95);
            await tick();
            const bytes = await pdf.save();

            if (cancelRef.current) return;
            const blob = bytesToBlob(bytes);
            setResult(blob);
            setResultInfo({ pages: keptCount, size: blob.size });
            setProgress(100);
            await new Promise((r) => setTimeout(r, 350));
            if (mounted.current && !cancelRef.current) setStatus("done");
        } catch (error) {
            console.error("Rotate failed:", error);
            setModalError("The PDF could not be changed. It may be damaged, password-protected, or use features this tool cannot process. Try another file.");
            setStatus("error");
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus("idle"); setProgress(0); };
    const closeModal = () => { setStatus("idle"); setModalError(null); };

    const resetPage = () => {
        cancelRef.current = true;
        loadToken.current++;
        previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrls.current.clear();
        setFile(null);
        setPages([]);
        setThumbs({});
        setResult(null);
        setResultInfo(null);
        setStatus("idle");
        setProgress(0);
        setMessage("");
        setModalError(null);
        setLoadError(null);
    };

    const safeName = safeBaseName(outName);
    const btn = "px-3 py-2 text-xs sm:text-sm border rounded-lg bg-white text-gray-800 hover:bg-gray-100 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                <header className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                        <RotateCw className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Rotate and Remove PDF Pages</h1>
                    <p className="mx-auto mt-3 max-w-3xl leading-relaxed text-gray-700">
                        Turn sideways or upside-down pages the right way up, rotate individual pages or groups of pages, and remove pages you do
                        not need. Check each change in the thumbnails, then download a new PDF. The work runs in your browser; this tool does not
                        upload the PDF to our server.
                    </p>
                </header>

                {!file ? (
                    <div>
                        <FileDropzone onFiles={loadFile} multiple={false} label="Choose one PDF file" />
                        <p className="mt-3 text-center text-sm text-gray-700">After the PDF opens, rotate or remove pages in the thumbnail view.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <FileText className="h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-teal-900">{pages.length} {pages.length === 1 ? "page" : "pages"} · {formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <button type="button" onClick={resetPage} className="shrink-0 text-sm font-medium text-red-700 hover:underline">Choose another PDF</button>
                        </div>

                        <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4" aria-labelledby="actions-heading">
                            <h2 id="actions-heading" className="sr-only">Rotate and select pages</h2>
                            <div>
                                <p className="mb-2 text-xs font-bold text-gray-700">Rotate</p>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className={btn} onClick={() => rotateWhere(-90, () => true)}><RotateCcw className="h-4 w-4" aria-hidden="true" /> All left</button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(90, () => true)}><RotateCw className="h-4 w-4" aria-hidden="true" /> All right</button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(180, () => true)}>All 180°</button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(90, (_p, i) => i % 2 === 0)}>Odd pages right</button>
                                    <button type="button" className={btn} onClick={() => rotateWhere(90, (_p, i) => i % 2 === 1)}>Even pages right</button>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-bold text-gray-700">Selected pages ({selectedCount})</p>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className={btn} onClick={() => selectWhere(() => true)}>Select all</button>
                                    <button type="button" className={btn} onClick={() => selectWhere(() => false)}>Select none</button>
                                    <button type="button" className={btn} onClick={() => selectWhere((_p, i) => i % 2 === 0)}>Odd</button>
                                    <button type="button" className={btn} onClick={() => selectWhere((_p, i) => i % 2 === 1)}>Even</button>
                                    <button type="button" className={btn} disabled={selectedCount === 0} onClick={() => rotateWhere(-90, (p) => p.selected)}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Left</button>
                                    <button type="button" className={btn} disabled={selectedCount === 0} onClick={() => rotateWhere(90, (p) => p.selected)}><RotateCw className="h-4 w-4" aria-hidden="true" /> Right</button>
                                    <button type="button" className={`${btn} !text-red-700`} disabled={selectedCount === 0} onClick={removeSelected}><Trash2 className="h-4 w-4" aria-hidden="true" /> Remove</button>
                                    <button type="button" className={btn} disabled={!hasChanges} onClick={resetEdits}><Eraser className="h-4 w-4" aria-hidden="true" /> Undo all changes</button>
                                </div>
                            </div>
                        </section>

                        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-label="PDF pages">
                            {pages.map((p, i) => (
                                <li
                                    key={i}
                                    className={`rounded-xl border-2 bg-gray-50 p-2 transition ${p.removed ? "border-red-200 opacity-60" : p.selected ? "border-teal-600 ring-2 ring-teal-100" : "border-gray-200"}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => !p.removed && updatePage(i, { selected: !p.selected })}
                                        aria-pressed={p.selected}
                                        aria-label={`${p.selected ? "Deselect" : "Select"} page ${i + 1}${p.rot ? `, rotated ${p.rot} degrees` : ""}${p.removed ? ", removed" : ""}`}
                                        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-white"
                                    >
                                        {thumbs[i] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={thumbs[i]}
                                                alt={`Preview of page ${i + 1}`}
                                                draggable={false}
                                                className="max-h-[88%] max-w-[88%] object-contain shadow transition-transform duration-300"
                                                style={{ transform: `rotate(${p.rot}deg)` }}
                                            />
                                        ) : (
                                            <span className="px-2 text-center text-xs text-gray-700">Preview unavailable</span>
                                        )}
                                        <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 text-[10px] text-white">Page {i + 1}</span>
                                        {p.rot !== 0 && !p.removed && <span className="absolute left-1 top-1 rounded bg-teal-700 px-1.5 text-[10px] text-white">{p.rot}°</span>}
                                        {p.selected && !p.removed && <span className="absolute right-1 top-1 rounded-full bg-teal-700 p-0.5 text-white"><Check className="h-3 w-3" /></span>}
                                        {p.removed && <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-bold text-red-800">REMOVED</span>}
                                    </button>
                                    <div className="mt-2 flex items-center justify-center gap-1">
                                        {p.removed ? (
                                            <button type="button" onClick={() => updatePage(i, { removed: false })} className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-800 hover:bg-gray-200" aria-label={`Restore page ${i + 1}`}>
                                                <Undo2 className="h-4 w-4" aria-hidden="true" /> Restore
                                            </button>
                                        ) : (
                                            <>
                                                <button type="button" onClick={() => rotatePage(i, -90)} className="rounded-lg p-1.5 hover:bg-gray-200" aria-label={`Rotate page ${i + 1} left`}><RotateCcw className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => rotatePage(i, 90)} className="rounded-lg p-1.5 hover:bg-gray-200" aria-label={`Rotate page ${i + 1} right`}><RotateCw className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => updatePage(i, { removed: true, selected: false })} className="rounded-lg p-1.5 text-red-700 hover:bg-red-50" aria-label={`Remove page ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <p className="text-sm text-gray-800" aria-live="polite">
                            {rotatedCount} rotated · {removedCount} removed · {keptCount} {keptCount === 1 ? "page" : "pages"} in the final PDF
                        </p>
                        {keptCount === 0 && <p className="text-sm text-red-800" role="alert">You removed every page. Restore at least one page.</p>}
                        {!hasChanges && <p className="text-sm text-gray-700">Rotate or remove at least one page to enable the button below.</p>}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <label htmlFor="rotate-output" className="sr-only">Output PDF file name</label>
                            <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 sm:w-72">
                                <input id="rotate-output" value={outName} onChange={(e) => setOutName(e.target.value)} className="min-w-0 flex-1 px-3 py-3 text-sm focus:outline-none" placeholder="File name" />
                                <span className="bg-gray-50 px-3 py-3 text-sm text-gray-700">.pdf</span>
                            </div>
                            <div className="flex-1">
                                <ProcessButton onClick={handleApply} loading={status === "processing"} disabled={!canRun} label="Apply changes and create PDF" loadingLabel="Processing..." />
                            </div>
                        </div>
                    </div>
                )}

                {loadError && (
                    <div role="alert" className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /> <span>{loadError}</span>
                    </div>
                )}

                {resultInfo && status === "done" && (
                    <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4" aria-live="polite">
                        <h2 className="font-semibold text-green-950">Your PDF is ready</h2>
                        <p className="mt-1 text-sm text-green-900">The new PDF has {resultInfo.pages} {resultInfo.pages === 1 ? "page" : "pages"}. File size: {formatBytes(resultInfo.size)}.</p>
                        <p className="mt-1 text-xs text-green-900">Open it and check the page orientation and order before sharing it.</p>
                    </section>
                )}

                <section aria-labelledby="rotate-guide-heading" className="mt-10 space-y-6 text-gray-800">
                    <h2 id="rotate-guide-heading" className="text-2xl font-bold text-gray-900">Fixing page orientation in a PDF</h2>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Common situations</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
                            <li><strong>A scan came out sideways:</strong> rotate the affected pages 90° left or right until the text reads normally.</li>
                            <li><strong>Alternate pages are wrong:</strong> double-sided scans sometimes flip every second page. Use the odd or even page buttons to fix them together.</li>
                            <li><strong>One landscape page in a portrait document:</strong> rotate only that page, then check how it looks in your PDF viewer.</li>
                            <li><strong>A blank or unwanted page:</strong> remove it before downloading. You can restore a removed page until you create the file.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">How rotation is applied</h3>
                        <p className="mt-2 leading-relaxed">
                            The tool changes each page&apos;s display rotation in a new copy of the PDF. Text and images are not redrawn, so quality is
                            not reduced. The rotation you choose is added to any rotation the page already has, and the thumbnails show the result
                            before you create the file. Your original file is not changed.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Troubleshooting</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
                            <li><strong>The PDF will not open:</strong> it may be damaged or password-protected. Remove the password in the program that created it, then try again.</li>
                            <li><strong>A page looks different in another viewer:</strong> some programs ignore page rotation settings. Test the downloaded file in the program where it will be used.</li>
                            <li><strong>Thumbnails are missing:</strong> previews can fail for unusual PDFs. Rotation may still work, so check the result after downloading.</li>
                            <li><strong>The button is disabled:</strong> rotate or remove at least one page, and keep at least one page in the document.</li>
                        </ul>
                    </div>
                </section>

                <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>
                            <strong>Privacy and limitations:</strong> the PDF is processed in your browser and is not uploaded to our server for this tool. Password-protected or damaged PDFs may fail. Keep your original file. See the <a href="/privacy" className="underline">Privacy Policy</a> for how the site handles other information.
                        </p>
                    </div>
                </aside>
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Applying your changes"
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
                    "Choose one PDF from your device. Page thumbnails appear after it opens.",
                    "Rotate a single page with the buttons under its thumbnail, or rotate all, odd, even or selected pages together.",
                    "Select pages to rotate or remove them as a group. A removed page can be restored before you create the file.",
                    "Check the thumbnails, the rotated and removed counts, and the final page count.",
                    "Apply the changes, download the new PDF, and open it to check the result before sharing it.",
                ]}
            />
        </main>
    );
}
