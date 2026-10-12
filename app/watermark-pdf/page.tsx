"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from "pdf-lib";
import { AlertCircle, FileText, ImageIcon, ShieldCheck, Stamp, Type, X } from "lucide-react";
import FileDropzone from "@/components/pdf/FileDropzone";
import ProcessButton from "@/components/pdf/ProcessButton";
import ProcessingModal, { ProcessStatus } from "@/components/pdf/ProcessingModal";
import { formatBytes, bytesToBlob, parsePageRange, renderPdfThumbnails } from "@/lib/pdf-utils";
import ToolSeoContent from "@/components/ToolSeoContent";

type WmMode = "text" | "image";
type Pos = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";
type PageSel = "all" | "odd" | "even" | "custom";
type FontKey = "helveticaBold" | "helvetica" | "timesBold" | "times" | "courierBold";

const FONTS: Record<FontKey, { label: string; std: StandardFonts; css: string; weight: number }> = {
    helveticaBold: { label: "Helvetica Bold", std: StandardFonts.HelveticaBold, css: "Helvetica, Arial, sans-serif", weight: 700 },
    helvetica: { label: "Helvetica", std: StandardFonts.Helvetica, css: "Helvetica, Arial, sans-serif", weight: 400 },
    timesBold: { label: "Times Bold", std: StandardFonts.TimesRomanBold, css: "Times New Roman, serif", weight: 700 },
    times: { label: "Times Roman", std: StandardFonts.TimesRoman, css: "Times New Roman, serif", weight: 400 },
    courierBold: { label: "Courier Bold", std: StandardFonts.CourierBold, css: "Courier New, monospace", weight: 700 },
};

const POS_GRID: Pos[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
const POS_LABEL: Record<Pos, string> = {
    tl: "top left", tc: "top center", tr: "top right",
    ml: "middle left", mc: "center", mr: "middle right",
    bl: "bottom left", bc: "bottom center", br: "bottom right",
};
const IMG_ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";
const PREVIEW_W = 300;
const MAX_TILES = 600;
const CAP = 0.72;

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

function hexToRgb(hex: string) {
    const h = hex.replace("#", "");
    const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

function cleanText(t: string) {
    return t.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

function applyTokens(text: string, page: number, total: number) {
    const date = new Date().toLocaleDateString();
    return text
        .replace(/\{page\}/gi, String(page))
        .replace(/\{total\}/gi, String(total))
        .replace(/\{date\}/gi, date);
}

function safeBaseName(value: string): string {
    return value.trim().replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "_") || "watermarked";
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
    const cx = h === "l" ? margin + bbw / 2 : h === "r" ? W - margin - bbw / 2 : W / 2;
    const cy = v === "t" ? H - margin - bbh / 2 : v === "b" ? margin + bbh / 2 : H / 2;
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

    const [wmMode, setWmMode] = useState<WmMode>("text");
    const [text, setText] = useState("CONFIDENTIAL");
    const [fontKey, setFontKey] = useState<FontKey>("helveticaBold");
    const [fontSize, setFontSize] = useState(60);
    const [color, setColor] = useState("#888888");
    const [opacity, setOpacity] = useState(35);
    const [rotation, setRotation] = useState(45);
    const [pos, setPos] = useState<Pos>("mc");
    const [margin, setMargin] = useState(30);
    const [tile, setTile] = useState(false);
    const [spacing, setSpacing] = useState(60);
    const [pageSel, setPageSel] = useState<PageSel>("all");
    const [customRange, setCustomRange] = useState("");
    const [outName, setOutName] = useState("watermarked");

    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
    const [imgWidthPct, setImgWidthPct] = useState(40);

    const [previewFont, setPreviewFont] = useState<PDFFont | null>(null);

    const [status, setStatus] = useState<ProcessStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [resultInfo, setResultInfo] = useState<{ pages: number; size: number } | null>(null);

    const cancelRef = useRef(false);
    const mounted = useRef(false);
    const loadToken = useRef(0);
    const imgUrlRef = useRef<string | null>(null);
    const thumbUrlRef = useRef<string | null>(null);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            loadToken.current++;
            if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
            if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const d = await PDFDocument.create();
                const f = await d.embedFont(FONTS[fontKey].std);
                if (!cancelled) setPreviewFont(f);
            } catch {
                if (!cancelled) setPreviewFont(null);
            }
        })();
        return () => { cancelled = true; };
    }, [fontKey]);

    const loadFile = async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
            setLoadError("Choose a PDF file (.pdf). Other file types are not supported.");
            return;
        }
        const token = ++loadToken.current;
        setLoadError(null);
        setThumb(null);
        setResult(null);
        setResultInfo(null);
        try {
            const doc = await PDFDocument.load(await f.arrayBuffer());
            if (!mounted.current || token !== loadToken.current) return;
            if (doc.getPageCount() < 1) throw new Error("The PDF has no pages.");
            const { width, height } = doc.getPage(0).getSize();
            setFile(f);
            setPageCount(doc.getPageCount());
            setFirstSize({ w: width, h: height });
            setCustomRange("");
            setOutName(safeBaseName(f.name) + "-watermarked");
            let got = false;
            renderPdfThumbnails(
                f,
                (_i, url) => {
                    if (!mounted.current || token !== loadToken.current) { URL.revokeObjectURL(url); return; }
                    if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
                    thumbUrlRef.current = url;
                    setThumb(url);
                    got = true;
                },
                () => got || !mounted.current || token !== loadToken.current,
                480
            ).catch(() => { /* the preview image is optional */ });
        } catch (error) {
            console.error("PDF load failed:", error);
            if (mounted.current && token === loadToken.current) {
                setFile(null);
                setLoadError("This PDF could not be opened. It may be damaged or password-protected. This tool cannot unlock protected PDFs.");
            }
        }
    };

    const loadImage = (files: File[]) => {
        const f = files[0];
        if (!f) return;
        if (!/^image\/(png|jpeg)$/.test(f.type) && !/\.(png|jpe?g)$/i.test(f.name)) {
            setLoadError("Choose a PNG or JPG image for the watermark.");
            return;
        }
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
            if (!mounted.current) { URL.revokeObjectURL(url); return; }
            if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
            imgUrlRef.current = url;
            setLoadError(null);
            setImgFile(f);
            setImgUrl(url);
            setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => { URL.revokeObjectURL(url); setLoadError("That image could not be read. Try a different PNG or JPG file."); };
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
        pageSel === "custom" && (customRange.trim() === "" || parsePageRange(customRange, pageCount) === null);

    const targetIdx = useMemo(() => {
        if (!pageCount) return [] as number[];
        const all = Array.from({ length: pageCount }, (_, i) => i);
        if (pageSel === "odd") return all.filter((i) => i % 2 === 0);
        if (pageSel === "even") return all.filter((i) => i % 2 === 1);
        if (pageSel === "custom") {
            const p = parsePageRange(customRange, pageCount);
            return p ? Array.from(new Set(p)).sort((a, b) => a - b) : [];
        }
        return all;
    }, [pageSel, customRange, pageCount]);

    const strippedChars = wmMode === "text" && cleanText(text) !== text;

    const preview = useMemo(() => {
        if (!firstSize) return null;
        const W = firstSize.w;
        const H = firstSize.h;
        let bw = 0;
        let bh = 0;
        let label = "";
        if (wmMode === "text") {
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
        Boolean(file) && targetIdx.length > 0 && !rangeInvalid && status !== "processing" &&
        (wmMode === "text" ? cleanText(text).trim().length > 0 : Boolean(imgFile));

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
            const pages = pdf.getPages();
            const total = pages.length;
            const op = opacity / 100;

            const font = wmMode === "text" ? await pdf.embedFont(FONTS[fontKey].std) : null;
            const textColor = hexToRgb(color);

            let image: Awaited<ReturnType<PDFDocument["embedPng"]>> | null = null;
            if (wmMode === "image" && imgFile) {
                const buf = await imgFile.arrayBuffer();
                image = imgFile.type === "image/png" || /\.png$/i.test(imgFile.name) ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
            }

            for (let k = 0; k < targetIdx.length; k++) {
                if (cancelRef.current) return;
                const idx = targetIdx[k];
                const page = pages[idx];
                const { width: W, height: H } = page.getSize();

                if (wmMode === "text" && font) {
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
                    setMessage(`Adding the watermark to page ${idx + 1} (${k + 1} of ${targetIdx.length})`);
                    setProgress(((k + 1) / targetIdx.length) * 90);
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
            setResultInfo({ pages: targetIdx.length, size: blob.size });
            setProgress(100);
            await new Promise((r) => setTimeout(r, 350));
            if (mounted.current && !cancelRef.current) setStatus("done");
        } catch (error) {
            console.error("Watermark failed:", error);
            setModalError("The watermark could not be added. The PDF may be damaged, password-protected, or use features this tool cannot process. Try another file.");
            setStatus("error");
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus("idle"); setProgress(0); };
    const closeModal = () => { setStatus("idle"); setModalError(null); };

    const resetAll = () => {
        cancelRef.current = true;
        loadToken.current++;
        if (thumbUrlRef.current) { URL.revokeObjectURL(thumbUrlRef.current); thumbUrlRef.current = null; }
        setFile(null);
        setThumb(null);
        setPageCount(0);
        setFirstSize(null);
        setResult(null);
        setResultInfo(null);
        setStatus("idle");
        setProgress(0);
        setMessage("");
        setModalError(null);
        setLoadError(null);
    };

    const safeName = safeBaseName(outName);
    const selectCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600";
    const labelCls = "block text-xs font-semibold text-gray-700 mb-1";
    const card = "p-4 rounded-2xl border border-gray-200 bg-gray-50";

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                <header className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <Stamp className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Add a Text or Image Watermark to a PDF</h1>
                    <p className="mx-auto mt-3 max-w-3xl leading-relaxed text-gray-700">
                        Stamp a visible text or logo watermark on selected PDF pages, such as DRAFT, COPY or CONFIDENTIAL. Choose the position,
                        opacity, rotation and pages, check the live preview, and download a new PDF. The work runs in your browser; this tool
                        does not upload the PDF to our server.
                    </p>
                </header>

                {!file ? (
                    <div>
                        <FileDropzone onFiles={loadFile} multiple={false} label="Choose one PDF file" />
                        <p className="mt-3 text-center text-sm text-gray-700">After the PDF opens, choose the watermark and the pages to mark.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <FileText className="h-6 w-6 shrink-0 text-indigo-700" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-indigo-900">{pageCount} {pageCount === 1 ? "page" : "pages"} · {formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <button type="button" onClick={resetAll} className="shrink-0 text-sm font-medium text-red-700 hover:underline">Choose another PDF</button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                            <div className="order-2 space-y-5 lg:order-1">
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { k: "text", t: "Text watermark", I: Type },
                                        { k: "image", t: "Image watermark", I: ImageIcon },
                                    ] as const).map(({ k, t, I }) => (
                                        <button
                                            type="button"
                                            key={k}
                                            onClick={() => setWmMode(k)}
                                            aria-pressed={wmMode === k}
                                            className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold ${wmMode === k ? "border-indigo-700 bg-indigo-50 text-indigo-800" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
                                        >
                                            <I className="h-4 w-4" aria-hidden="true" /> {t}
                                        </button>
                                    ))}
                                </div>

                                {wmMode === "text" ? (
                                    <section className={card} aria-labelledby="text-heading">
                                        <h2 id="text-heading" className="mb-3 text-sm font-bold text-gray-900">Text</h2>
                                        <label className={labelCls} htmlFor="wm-text">
                                            Watermark text. Optional tokens: {"{page}"} {"{total}"} {"{date}"}
                                        </label>
                                        <input id="wm-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" className={selectCls} />
                                        {strippedChars && (
                                            <p className="mt-2 text-xs text-amber-800">
                                                Some characters (for example Tamil or Arabic letters) are not supported by the PDF built-in fonts and will be skipped. Use an image watermark for those languages.
                                            </p>
                                        )}
                                        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                                            <div>
                                                <label className={labelCls} htmlFor="wm-font">Font</label>
                                                <select id="wm-font" value={fontKey} onChange={(e) => setFontKey(e.target.value as FontKey)} className={selectCls}>
                                                    {Object.entries(FONTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls} htmlFor="wm-size">Size: {fontSize} pt</label>
                                                <input id="wm-size" type="range" min={10} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value, 10))} className="w-full accent-indigo-700" />
                                            </div>
                                            <div>
                                                <label className={labelCls} htmlFor="wm-color">Color</label>
                                                <input id="wm-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1" />
                                            </div>
                                        </div>
                                    </section>
                                ) : (
                                    <section className={card} aria-labelledby="image-heading">
                                        <h2 id="image-heading" className="mb-3 text-sm font-bold text-gray-900">Image</h2>
                                        {!imgFile ? (
                                            <FileDropzone onFiles={loadImage} multiple={false} accept={IMG_ACCEPT} compact label="Select a PNG or JPG logo" />
                                        ) : (
                                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={imgUrl ?? ""} alt="Selected watermark image" className="h-14 w-14 rounded-lg bg-gray-100 object-contain" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-gray-900">{imgFile.name}</p>
                                                    <p className="text-xs text-gray-700">{imgDims?.w}×{imgDims?.h} · {formatBytes(imgFile.size)}</p>
                                                </div>
                                                <button type="button" onClick={clearImage} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label="Remove watermark image">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="mt-3">
                                            <label className={labelCls} htmlFor="wm-img-width">Width: {imgWidthPct}% of page width</label>
                                            <input id="wm-img-width" type="range" min={5} max={100} value={imgWidthPct} onChange={(e) => setImgWidthPct(parseInt(e.target.value, 10))} className="w-full accent-indigo-700" />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-700">Use only images you have the right to use. A PNG with a transparent background usually looks best.</p>
                                    </section>
                                )}

                                <section className={card} aria-labelledby="style-heading">
                                    <h2 id="style-heading" className="mb-3 text-sm font-bold text-gray-900">Style</h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className={labelCls} htmlFor="wm-opacity">Opacity: {opacity}%</label>
                                            <input id="wm-opacity" type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value, 10))} className="w-full accent-indigo-700" />
                                        </div>
                                        <div>
                                            <label className={labelCls} htmlFor="wm-rotation">Rotation: {rotation}°</label>
                                            <input id="wm-rotation" type="range" min={-180} max={180} value={rotation} onChange={(e) => setRotation(parseInt(e.target.value, 10))} className="w-full accent-indigo-700" />
                                            <div className="mt-1 flex gap-1">
                                                {[0, 45, -45, 90].map((a) => (
                                                    <button type="button" key={a} onClick={() => setRotation(a)} className="rounded border bg-white px-2 py-0.5 text-xs hover:bg-gray-100">{a}°</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className={card} aria-labelledby="position-heading">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 id="position-heading" className="text-sm font-bold text-gray-900">Position</h2>
                                        <label className="flex items-center gap-2 text-sm text-gray-800">
                                            <input type="checkbox" checked={tile} onChange={(e) => setTile(e.target.checked)} className="accent-indigo-700" />
                                            Repeat across the page (tile)
                                        </label>
                                    </div>
                                    {!tile ? (
                                        <div className="flex flex-wrap items-start gap-6">
                                            <div className="grid w-28 grid-cols-3 gap-1" role="group" aria-label="Watermark position">
                                                {POS_GRID.map((p) => (
                                                    <button
                                                        type="button"
                                                        key={p}
                                                        onClick={() => setPos(p)}
                                                        aria-pressed={pos === p}
                                                        aria-label={`Position: ${POS_LABEL[p]}`}
                                                        className={`h-8 rounded border ${pos === p ? "border-indigo-700 bg-indigo-700" : "border-gray-300 bg-white hover:bg-gray-100"}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="min-w-[160px] flex-1">
                                                <label className={labelCls} htmlFor="wm-margin">Edge margin: {margin} pt</label>
                                                <input id="wm-margin" type="range" min={0} max={150} value={margin} onChange={(e) => setMargin(parseInt(e.target.value, 10))} className="w-full accent-indigo-700" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className={labelCls} htmlFor="wm-spacing">Spacing between copies: {spacing}%</label>
                                            <input id="wm-spacing" type="range" min={0} max={300} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} className="w-full accent-indigo-700" />
                                            <p className="mt-1 text-xs text-gray-700">If the settings would create too many copies, a single watermark is used instead. Increase the spacing or size to tile.</p>
                                        </div>
                                    )}
                                </section>

                                <section className={card} aria-labelledby="pages-heading">
                                    <h2 id="pages-heading" className="mb-3 text-sm font-bold text-gray-900">Pages</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {([
                                            ["all", "All pages"], ["odd", "Odd pages"], ["even", "Even pages"], ["custom", "Custom range"],
                                        ] as [PageSel, string][]).map(([k, l]) => (
                                            <button
                                                type="button"
                                                key={k}
                                                onClick={() => setPageSel(k)}
                                                aria-pressed={pageSel === k}
                                                className={`rounded-lg border px-3 py-2 text-xs ${pageSel === k ? "border-indigo-700 bg-indigo-700 text-white" : "bg-white text-gray-800 hover:bg-gray-100"}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                    {pageSel === "custom" && (
                                        <div className="mt-3">
                                            <label htmlFor="wm-range" className="sr-only">Custom page range</label>
                                            <input
                                                id="wm-range"
                                                value={customRange}
                                                onChange={(e) => setCustomRange(e.target.value)}
                                                placeholder="e.g. 1-3, 5, 8-10"
                                                aria-invalid={rangeInvalid}
                                                className={`${selectCls} ${rangeInvalid ? "border-red-600" : ""}`}
                                            />
                                            {rangeInvalid && <p className="mt-1 text-xs text-red-800" role="alert">Enter valid pages from 1 to {pageCount}, such as 1-3, 5.</p>}
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-gray-700">{targetIdx.length} of {pageCount} pages will be watermarked.</p>
                                </section>
                            </div>

                            <aside className="order-1 lg:order-2" aria-label="Preview">
                                <div className="lg:sticky lg:top-6">
                                    <p className="mb-2 text-center text-xs font-semibold text-gray-700">Preview of page 1</p>
                                    <div className="relative mx-auto overflow-hidden border border-gray-300 bg-white shadow-md" style={{ width: PREVIEW_W, height: previewH }}>
                                        {thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumb} alt="Preview of page 1" className="absolute inset-0 h-full w-full object-fill" draggable={false} />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-700">Preview loading or unavailable</div>
                                        )}
                                        {preview && preview.spots.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    position: "absolute",
                                                    left: s.cx * scale,
                                                    top: (preview.H - s.cy) * scale,
                                                    width: preview.bw * scale,
                                                    height: preview.bh * scale,
                                                    transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                                                    opacity: opacity / 100,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                {wmMode === "text" ? (
                                                    <span style={{ fontSize: fontSize * scale, color, fontFamily: FONTS[fontKey].css, fontWeight: FONTS[fontKey].weight, lineHeight: 1, whiteSpace: "nowrap" }}>
                                                        {preview.label}
                                                    </span>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={imgUrl ?? ""} alt="" style={{ width: "100%", height: "100%", objectFit: "fill" }} draggable={false} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-center text-xs text-gray-700">
                                        The preview approximates the result. Fonts and spacing can differ slightly, so open the downloaded PDF to check it.
                                    </p>
                                </div>
                            </aside>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <label htmlFor="wm-output" className="sr-only">Output PDF file name</label>
                            <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 sm:w-72">
                                <input id="wm-output" value={outName} onChange={(e) => setOutName(e.target.value)} className="min-w-0 flex-1 px-3 py-3 text-sm focus:outline-none" placeholder="File name" />
                                <span className="bg-gray-50 px-3 py-3 text-sm text-gray-700">.pdf</span>
                            </div>
                            <div className="flex-1">
                                <ProcessButton onClick={handleApply} loading={status === "processing"} disabled={!canRun} label="Add watermark" loadingLabel="Adding watermark..." />
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
                        <h2 className="font-semibold text-green-950">Your watermarked PDF is ready</h2>
                        <p className="mt-1 text-sm text-green-900">Watermarked {resultInfo.pages} {resultInfo.pages === 1 ? "page" : "pages"}. File size: {formatBytes(resultInfo.size)}.</p>
                        <p className="mt-1 text-xs text-green-900">Open the PDF and check the position, readability and page range before sharing it.</p>
                    </section>
                )}

                <section aria-labelledby="watermark-guide-heading" className="mt-10 space-y-6 text-gray-800">
                    <h2 id="watermark-guide-heading" className="text-2xl font-bold text-gray-900">Using PDF watermarks well</h2>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Text or image?</h3>
                        <p className="mt-2 leading-relaxed">
                            Use text for status labels such as DRAFT, COPY or CONFIDENTIAL. Use an image for a logo or signature-style mark. The
                            built-in PDF fonts support basic Latin characters only, so for other scripts create an image of the text and use it as an
                            image watermark.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Keeping the document readable</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
                            <li>Lower the opacity so the page text stays legible; the default is 35%.</li>
                            <li>A diagonal watermark of 45° is common because it crosses the page without covering one block of text.</li>
                            <li>Use an edge position with a small size for letterheads or logos, and the center position for status labels.</li>
                            <li>Use the page selection to leave a cover page or signature page unmarked.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">What a watermark can and cannot do</h3>
                        <p className="mt-2 leading-relaxed">
                            This tool adds a visible mark to a copy of your PDF. It does not encrypt the file, prevent copying, or guarantee that the
                            mark cannot be removed. Keep your original PDF and do not rely on a visible watermark as the only protection for sensitive
                            documents.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Troubleshooting</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
                            <li><strong>The PDF will not open:</strong> it may be damaged or password-protected. Remove the password in the program that created it, then try again.</li>
                            <li><strong>Letters are missing from the text:</strong> unsupported characters are skipped. Use an image watermark instead.</li>
                            <li><strong>Tiling shows only one mark:</strong> the settings would create too many copies. Increase the size or spacing.</li>
                            <li><strong>The mark looks different in another viewer:</strong> open the downloaded PDF in your usual viewer and adjust the size, opacity or position.</li>
                        </ul>
                    </div>
                </section>

                <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>
                            <strong>Privacy and limitations:</strong> the PDF and any watermark image are processed in your browser and are not uploaded to our server for this tool. Password-protected or damaged PDFs may fail. See the <a href="/privacy" className="underline">Privacy Policy</a> for how the site handles other information.
                        </p>
                    </div>
                </aside>
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
                    "Choose one PDF from your device. The page count and file size appear after it opens.",
                    "Choose a text watermark, or select a PNG or JPG image you have the right to use.",
                    "Set the font, size and color for text, or the width for an image.",
                    "Adjust opacity, rotation and position, or tile the mark across the page.",
                    "Choose all pages, odd pages, even pages or a custom range, and check the preview.",
                    "Add the watermark, download the PDF, and open it to check the result before sharing.",
                ]}
            />
        </main>
    );
}
