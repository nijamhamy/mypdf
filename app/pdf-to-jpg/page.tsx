"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { AlertCircle, Check, FileText, Image as ImageIcon, ShieldCheck } from "lucide-react";
import FileDropzone from "@/components/pdf/FileDropzone";
import ProcessButton from "@/components/pdf/ProcessButton";
import ProcessingModal, { ProcessStatus } from "@/components/pdf/ProcessingModal";
import { formatBytes, parsePageRange, renderPdfThumbnails } from "@/lib/pdf-utils";
import ToolSeoContent from "@/components/ToolSeoContent";

type Format = "jpg" | "png" | "webp";

const FORMATS: Record<Format, { label: string; mime: string; ext: string; note: string }> = {
    jpg: { label: "JPG", mime: "image/jpeg", ext: "jpg", note: "Smaller files; lossy compression. Good for photos and general sharing." },
    png: { label: "PNG (lossless)", mime: "image/png", ext: "png", note: "Lossless and sharp for text or graphics, but files can be large." },
    webp: { label: "WebP", mime: "image/webp", ext: "webp", note: "Small files in supported apps; check compatibility before sharing." },
};
const DPI_OPTIONS = [72, 100, 150, 200, 300];
const MAX_PIXELS = 25_000_000;

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

function selectedToRange(selected: boolean[]): string {
    if (selected.length > 0 && selected.every(Boolean)) return "";
    const parts: string[] = [];
    let i = 0;
    while (i < selected.length) {
        if (!selected[i]) { i++; continue; }
        let j = i;
        while (j + 1 < selected.length && selected[j + 1]) j++;
        parts.push(i === j ? `${i + 1}` : `${i + 1}-${j + 1}`);
        i = j + 1;
    }
    return parts.join(", ");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image export failed or this format is unsupported."))), type, quality);
    });
}

function safeBaseName(value: string): string {
    return value.trim().replace(/\.(pdf|zip|jpe?g|png|webp)$/i, "").replace(/[\\/:*?"<>|]/g, "_") || "pages";
}

export default function PdfToJpgPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [selected, setSelected] = useState<boolean[]>([]);
    const [range, setRange] = useState("");
    const [loadError, setLoadError] = useState<string | null>(null);

    const [format, setFormat] = useState<Format>("jpg");
    const [dpi, setDpi] = useState(150);
    const [quality, setQuality] = useState(90);
    const [outName, setOutName] = useState("pages");

    const [status, setStatus] = useState<ProcessStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<Blob | null>(null);
    const [resultName, setResultName] = useState("pages.zip");
    const [modalError, setModalError] = useState<string | null>(null);
    const [resultInfo, setResultInfo] = useState<{ files: number; size: number } | null>(null);

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
        const picked = files[0];
        if (!picked) return;
        if (picked.type !== "application/pdf" && !/\.pdf$/i.test(picked.name)) {
            setLoadError("Choose a PDF file (.pdf). Other file types are not supported.");
            return;
        }
        const token = ++loadToken.current;
        setLoadError(null);
        setThumbs({});
        setResult(null);
        setResultInfo(null);
        try {
            const doc = await PDFDocument.load(await picked.arrayBuffer());
            if (!mounted.current || token !== loadToken.current) return;
            const count = doc.getPageCount();
            if (count < 1) throw new Error("The PDF has no pages.");
            const { width, height } = doc.getPage(0).getSize();
            setFile(picked);
            setPageCount(count);
            setPageSize({ w: width, h: height });
            setSelected(Array(count).fill(true));
            setRange("");
            setOutName(safeBaseName(picked.name));
            renderPdfThumbnails(
                picked,
                (index, url) => {
                    if (!mounted.current || token !== loadToken.current) { URL.revokeObjectURL(url); return; }
                    previewUrls.current.add(url);
                    setThumbs((previous) => ({ ...previous, [index]: url }));
                },
                () => !mounted.current || token !== loadToken.current,
                130
            ).catch(() => {
                if (mounted.current && token === loadToken.current) setLoadError("Page previews could not be generated. You can still convert the selected pages.");
            });
        } catch (error) {
            console.error("PDF load failed:", error);
            if (mounted.current && token === loadToken.current) {
                setFile(null);
                setLoadError("This PDF could not be opened. It may be damaged or password-protected. This tool cannot decrypt protected PDFs.");
            }
        }
    };

    const rangeInvalid = range.trim() !== "" && parsePageRange(range, pageCount) === null;

    const onRangeChange = (value: string) => {
        setRange(value);
        if (!value.trim()) return;
        const parsed = parsePageRange(value, pageCount);
        if (parsed) {
            const next = Array(pageCount).fill(false);
            parsed.forEach((index) => { next[index] = true; });
            setSelected(next);
        }
    };

    const togglePage = (index: number) => {
        const next = [...selected];
        next[index] = !next[index];
        setSelected(next);
        setRange(selectedToRange(next));
    };

    const setAll = (value: boolean) => {
        setSelected(Array(pageCount).fill(value));
        setRange("");
    };

    const selectedIdx = useMemo(
        () => selected.map((value, index) => (value ? index : -1)).filter((index) => index >= 0),
        [selected]
    );

    const outputDims = useMemo(() => {
        if (!pageSize) return null;
        let scale = dpi / 72;
        const pixels = pageSize.w * scale * pageSize.h * scale;
        let limited = false;
        if (pixels > MAX_PIXELS) {
            scale *= Math.sqrt(MAX_PIXELS / pixels);
            limited = true;
        }
        return { w: Math.round(pageSize.w * scale), h: Math.round(pageSize.h * scale), limited };
    }, [pageSize, dpi]);

    const canRun = Boolean(file) && selectedIdx.length > 0 && !rangeInvalid && status !== "processing";

    const handleConvert = async () => {
        if (!file || !canRun) return;
        cancelRef.current = false;
        setResult(null);
        setResultInfo(null);
        setModalError(null);
        setProgress(0);
        setMessage("Opening the PDF...");
        setStatus("processing");
        await tick();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let loadingTask: any = null;
        try {
            const pdfjs = await import("pdfjs-dist");
            pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
            const data = new Uint8Array(await file.arrayBuffer());
            loadingTask = pdfjs.getDocument({ data });
            const doc = await loadingTask.promise;

            const fmt = FORMATS[format];
            const imageQuality = format === "png" ? undefined : quality / 100;
            const base = safeBaseName(outName);
            const pad = String(pageCount).length;
            const total = selectedIdx.length;
            const rendered: { name: string; blob: Blob }[] = [];

            for (let k = 0; k < total; k++) {
                if (cancelRef.current) return;
                const pageNo = selectedIdx[k] + 1;
                setMessage(`Rendering page ${pageNo} (${k + 1} of ${total})`);
                await tick();

                const page = await doc.getPage(pageNo);
                const baseViewport = page.getViewport({ scale: 1 });
                let scale = dpi / 72;
                const pixels = baseViewport.width * scale * baseViewport.height * scale;
                if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement("canvas");
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const context = canvas.getContext("2d");
                if (!context) throw new Error("Canvas is not supported in this browser.");
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                const blob = await canvasToBlob(canvas, fmt.mime, imageQuality);
                canvas.width = 0;
                canvas.height = 0;
                if (format === "webp" && blob.type !== "image/webp") throw new Error("This browser cannot export WebP images.");

                rendered.push({ name: `${base}-page-${String(pageNo).padStart(pad, "0")}.${fmt.ext}`, blob });
                setProgress(((k + 1) / total) * (total > 1 ? 85 : 95));
            }

            if (cancelRef.current) return;

            let finalBlob: Blob;
            let finalName: string;
            if (rendered.length === 1) {
                finalBlob = rendered[0].blob;
                finalName = rendered[0].name;
            } else {
                setMessage("Packaging images into a ZIP file...");
                await tick();
                const JSZip = (await import("jszip")).default;
                const zip = new JSZip();
                rendered.forEach((item) => zip.file(item.name, item.blob));
                finalBlob = await zip.generateAsync({ type: "blob", compression: "STORE" }, (meta) => {
                    if (!cancelRef.current) setProgress(85 + (meta.percent / 100) * 14);
                });
                finalName = `${base}-images.zip`;
            }

            if (cancelRef.current) return;
            setResult(finalBlob);
            setResultName(finalName);
            setResultInfo({ files: rendered.length, size: finalBlob.size });
            setProgress(100);
            setMessage("Your images are ready.");
            await new Promise((resolve) => setTimeout(resolve, 350));
            if (mounted.current && !cancelRef.current) setStatus("done");
        } catch (error) {
            console.error("PDF to image conversion failed:", error);
            setModalError(
                error instanceof Error && /WebP/.test(error.message)
                    ? "This browser could not create WebP images. Choose JPG or PNG instead."
                    : "Conversion failed. The PDF may be damaged or password-protected, or the browser may not have enough memory. Try a lower DPI or fewer pages."
            );
            setStatus("error");
        } finally {
            if (loadingTask) {
                try { await loadingTask.destroy(); } catch { /* cleanup is best effort */ }
            }
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

    const resetAll = () => {
        cancelRef.current = true;
        loadToken.current++;
        previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrls.current.clear();
        setFile(null);
        setThumbs({});
        setSelected([]);
        setPageCount(0);
        setPageSize(null);
        setRange("");
        setResult(null);
        setResultInfo(null);
        setStatus("idle");
        setProgress(0);
        setMessage("");
        setModalError(null);
        setLoadError(null);
        setOutName("pages");
    };

    const selectCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-600";
    const labelCls = "block text-xs font-semibold text-gray-700 mb-1";

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <header className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl mb-4">
                        <ImageIcon className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Convert PDF Pages to JPG, PNG or WebP</h1>
                    <p className="text-gray-700 mt-3 max-w-3xl mx-auto leading-relaxed">
                        Select pages from a PDF and save them as JPG, PNG or WebP images. Choose the format and resolution,
                        check the estimated pixel size, and download one image or a ZIP. The conversion runs in your browser;
                        this tool does not upload the PDF to our server.
                    </p>
                </header>

                {!file ? (
                    <div>
                        <FileDropzone onFiles={loadFile} multiple={false} label="Choose one PDF file" />
                        <p className="mt-3 text-center text-sm text-gray-600">After the PDF opens, choose pages, image format and DPI.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-6 h-6 text-amber-700 shrink-0" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-amber-900">{pageCount} {pageCount === 1 ? "page" : "pages"} · {formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-700 hover:underline font-medium shrink-0">Choose another PDF</button>
                        </div>

                        <section aria-labelledby="image-settings-heading" className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                            <h2 id="image-settings-heading" className="text-sm font-bold text-gray-900 mb-3">Image settings</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label htmlFor="image-format" className={labelCls}>Format</label>
                                    <select id="image-format" value={format} onChange={(e) => setFormat(e.target.value as Format)} className={selectCls}>
                                        {Object.entries(FORMATS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="image-dpi" className={labelCls}>Resolution (DPI)</label>
                                    <select id="image-dpi" value={dpi} onChange={(e) => setDpi(Number.parseInt(e.target.value, 10))} className={selectCls}>
                                        {DPI_OPTIONS.map((value) => <option key={value} value={value}>{value} DPI</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="image-quality" className={labelCls}>Quality: {format === "png" ? "lossless" : `${quality}%`}</label>
                                    <input id="image-quality" type="range" min={30} max={100} value={quality} disabled={format === "png"} onChange={(e) => setQuality(Number.parseInt(e.target.value, 10))} className="w-full accent-amber-700 disabled:opacity-40" />
                                </div>
                                <div>
                                    <label htmlFor="image-prefix" className={labelCls}>File name prefix</label>
                                    <input id="image-prefix" value={outName} onChange={(e) => setOutName(e.target.value)} className={selectCls} />
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-700">{FORMATS[format].note}</p>
                            {outputDims && (
                                <p className="mt-2 text-xs text-gray-700">
                                    Estimated size for the first page: about {outputDims.w} × {outputDims.h} px
                                    {outputDims.limited && " (reduced to stay within browser memory limits)"}. Other pages may have different dimensions. Higher DPI can create larger files and may fail on low-memory devices.
                                </p>
                            )}
                        </section>

                        <section aria-labelledby="page-selection-heading" className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <h2 id="page-selection-heading" className="text-sm font-bold text-gray-900">Pages ({selectedIdx.length} of {pageCount} selected)</h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="page-range" className="sr-only">Pages to convert</label>
                                    <input
                                        id="page-range"
                                        value={range}
                                        onChange={(e) => onRangeChange(e.target.value)}
                                        placeholder="All pages (e.g. 1-3, 5)"
                                        aria-invalid={rangeInvalid}
                                        className={`w-full sm:w-56 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 ${rangeInvalid ? "border-red-600" : "border-gray-300"}`}
                                    />
                                    <button type="button" onClick={() => setAll(true)} className="px-3 py-2 text-xs border rounded-lg bg-white hover:bg-gray-100">Select all</button>
                                    <button type="button" onClick={() => setAll(false)} className="px-3 py-2 text-xs border rounded-lg bg-white hover:bg-gray-100">Select none</button>
                                </div>
                            </div>
                            {rangeInvalid && <p className="mb-3 text-sm text-red-800" role="alert">Enter valid pages from 1 to {pageCount}, such as 1-3, 5.</p>}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
                                {selected.map((on, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        onClick={() => togglePage(i)}
                                        aria-pressed={on}
                                        aria-label={`${on ? "Deselect" : "Select"} page ${i + 1}`}
                                        className={`relative rounded-lg border-2 overflow-hidden bg-white aspect-[3/4] flex items-center justify-center ${on ? "border-amber-600" : "border-gray-200 opacity-60"}`}
                                    >
                                        {thumbs[i] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumbs[i]} alt={`Preview of page ${i + 1}`} className="w-full h-full object-contain" draggable={false} />
                                        ) : (
                                            <span className="px-2 text-center text-xs text-gray-600">Preview unavailable</span>
                                        )}
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/75 text-white px-1.5 rounded">Page {i + 1}</span>
                                        {on && <span className="absolute top-1 right-1 bg-amber-700 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></span>}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <ProcessButton
                            onClick={handleConvert}
                            loading={status === "processing"}
                            disabled={!canRun}
                            label={selectedIdx.length === 1 ? "Convert 1 page to image" : `Convert ${selectedIdx.length} pages to images (ZIP)`}
                            loadingLabel="Creating images..."
                        />
                    </div>
                )}

                {loadError && (
                    <div className="mt-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-sm" role="alert">
                        <AlertCircle className="w-5 h-5 shrink-0" /> <span>{loadError}</span>
                    </div>
                )}

                {resultInfo && status === "done" && (
                    <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4" aria-live="polite">
                        <h2 className="font-semibold text-green-950">Your download is ready</h2>
                        <p className="mt-1 text-sm text-green-900">Created {resultInfo.files} {resultInfo.files === 1 ? "image" : "images"}. Download size: {formatBytes(resultInfo.size)}.</p>
                        <p className="mt-1 text-xs text-green-900">Open the images to check readability, cropping and file size before sharing them.</p>
                    </section>
                )}

                <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>
                            <strong>Privacy and limitations:</strong> the PDF is processed in your browser and is not uploaded to our server for this conversion. Password-protected or damaged PDFs may fail, and very large pages or high DPI settings may exceed browser memory. Keep your original PDF.
                        </p>
                    </div>
                </aside>
            </div>

            <ProcessingModal
                status={status}
                progress={progress}
                title="Converting PDF pages to images"
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
                    "Choose one PDF from your device. The page count and file size appear after it opens.",
                    "Choose JPG, PNG or WebP and select the resolution. Use a lower DPI if the browser runs out of memory.",
                    "Select pages with thumbnails or enter a range such as 1-3, 5.",
                    "Convert the selected pages. One page downloads as an image; several pages download as a ZIP.",
                    "Open the downloaded image or ZIP and check the result before sharing it.",
                ]}
            />
        </main>
    );
}
