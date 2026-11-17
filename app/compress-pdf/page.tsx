"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  PDFArray,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
} from "pdf-lib";
import type { PDFDict } from "pdf-lib";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Minimize2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import ToolSeoContent from "@/components/ToolSeoContent";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Mode = "auto" | "smart" | "raster";

type ResultInfo = {
  blobUrl: string;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
  method: string;
  hitTarget: boolean;
  targetBytes: number;
};

type Progress = { label: string; percent: number };

class CancelError extends Error {
  constructor() {
    super("cancelled");
  }
}

type SmartLevel = { quality: number; maxDim: number };

// From gentle to aggressive. maxDim = longest side in pixels of any image.
const SMART_LEVELS: SmartLevel[] = [
  { quality: 0.82, maxDim: 3000 },
  { quality: 0.72, maxDim: 2400 },
  { quality: 0.62, maxDim: 1900 },
  { quality: 0.52, maxDim: 1500 },
  { quality: 0.42, maxDim: 1200 },
  { quality: 0.34, maxDim: 950 },
  { quality: 0.28, maxDim: 750 },
];

// [dpi, jpeg quality], from best to smallest.
const RASTER_LADDER: Array<[number, number]> = [
  [200, 0.82],
  [170, 0.75],
  [150, 0.7],
  [130, 0.62],
  [110, 0.55],
  [96, 0.48],
  [80, 0.42],
  [72, 0.35],
  [60, 0.3],
  [50, 0.25],
];

const RASTER_BASE_DPI = 200;
const MAX_CANVAS_SIDE = 4200;
const MIN_IMAGE_BYTES = 20 * 1024; // do not touch tiny images

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeDownloadName(name: string): string {
  const base = name
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
  return `${base || "document"}-compressed.pdf`;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return reject(new Error("JPEG encoding failed"));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality
    );
  });
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Number of colour components of a JPEG (1 gray, 3 colour, 4 CMYK), or 0 if unknown. */
function jpegComponents(b: Uint8Array): number {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return b[i + 9];
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    i += 2 + len;
  }
  return 0;
}

function getFilters(dict: PDFDict): string[] {
  const f = dict.lookup(PDFName.of("Filter"));
  if (f instanceof PDFName) return [f.decodeText()];
  if (f instanceof PDFArray) {
    const out: string[] = [];
    for (let i = 0; i < f.size(); i++) {
      const item = f.lookup(i);
      out.push(item instanceof PDFName ? item.decodeText() : "");
    }
    return out;
  }
  return [];
}

function numberEntry(dict: PDFDict, key: string): number | undefined {
  const v = dict.lookup(PDFName.of(key));
  return v instanceof PDFNumber ? v.asNumber() : undefined;
}

/* ------------------------------------------------------------------ */
/* Engine 1: recompress embedded images (keeps text & vectors)         */
/* ------------------------------------------------------------------ */

async function decodeToCanvas(
  raw: PDFRawStream,
  dict: PDFDict,
  width: number,
  height: number
): Promise<HTMLCanvasElement | null> {
  const filters = getFilters(dict);
  if (filters.length !== 1) return null;
  const contents = raw.getContents();

  const canvas = document.createElement("canvas");

  if (filters[0] === "DCTDecode") {
    const comps = jpegComponents(contents);
    if (comps !== 1 && comps !== 3) return null; // skip CMYK / unknown
    const bitmap = await createImageBitmap(new Blob([contents as BlobPart], { type: "image/jpeg" }));
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return canvas;
  }

  if (filters[0] === "FlateDecode") {
    const cs = dict.lookup(PDFName.of("ColorSpace"));
    const bpc = numberEntry(dict, "BitsPerComponent");
    if (bpc !== 8 || !(cs instanceof PDFName)) return null;
    const csName = cs.decodeText();
    const channels = csName === "DeviceRGB" ? 3 : csName === "DeviceGray" ? 1 : 0;
    if (!channels) return null;

    const parms = dict.lookup(PDFName.of("DecodeParms"));
    if (parms) {
      const predictor = (parms as PDFDict).lookup?.(PDFName.of("Predictor"));
      if (predictor instanceof PDFNumber && predictor.asNumber() > 1) return null;
    }

    const data = await inflate(contents);
    if (data.length < width * height * channels) return null;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(width, height);
    const px = img.data;
    for (let i = 0, j = 0, n = width * height; i < n; i++, j += 4) {
      if (channels === 3) {
        const s = i * 3;
        px[j] = data[s];
        px[j + 1] = data[s + 1];
        px[j + 2] = data[s + 2];
      } else {
        px[j] = px[j + 1] = px[j + 2] = data[i];
      }
      px[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  return null;
}

async function compressEmbeddedImages(
  input: ArrayBuffer,
  level: SmartLevel,
  grayscale: boolean,
  isCancelled: () => boolean,
  onProgress: (p: Progress) => void,
  labelPrefix: string
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input, { updateMetadata: false });
  const context = pdf.context;

  const images = context.enumerateIndirectObjects().filter(([, obj]) => {
    return (
      obj instanceof PDFRawStream &&
      obj.dict.lookup(PDFName.of("Subtype")) === PDFName.of("Image")
    );
  });

  for (let i = 0; i < images.length; i++) {
    if (isCancelled()) throw new CancelError();
    const [ref, obj] = images[i];
    const raw = obj as PDFRawStream;
    const dict = raw.dict;

    onProgress({
      label: `${labelPrefix}Optimizing image ${i + 1} of ${images.length}`,
      percent: Math.round((i / Math.max(1, images.length)) * 90),
    });
    await tick();

    try {
      const origSize = raw.getContents().length;
      if (origSize < MIN_IMAGE_BYTES) continue;
      if (dict.lookup(PDFName.of("ImageMask"))?.toString() === "true") continue;
      if (dict.has(PDFName.of("Mask")) || dict.has(PDFName.of("Decode"))) continue;

      const w = numberEntry(dict, "Width");
      const h = numberEntry(dict, "Height");
      if (!w || !h) continue;

      const src = await decodeToCanvas(raw, dict, w, h);
      if (!src) continue;

      const scale = Math.min(1, level.maxDim / Math.max(src.width, src.height));
      const outW = Math.max(1, Math.round(src.width * scale));
      const outH = Math.max(1, Math.round(src.height * scale));

      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const octx = out.getContext("2d");
      if (!octx) continue;
      octx.fillStyle = "#fff";
      octx.fillRect(0, 0, outW, outH);
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";
      octx.drawImage(src, 0, 0, outW, outH);
      if (grayscale) applyGrayscale(octx, outW, outH);

      const jpeg = await canvasToJpeg(out, level.quality);
      if (jpeg.length >= origSize * 0.95) continue; // not worth replacing

      const newDict = context.obj({
        Type: "XObject",
        Subtype: "Image",
        Width: outW,
        Height: outH,
        ColorSpace: "DeviceRGB",
        BitsPerComponent: 8,
        Filter: "DCTDecode",
      });
      newDict.set(PDFName.of("Length"), PDFNumber.of(jpeg.length));
      const smask = dict.get(PDFName.of("SMask"));
      if (smask) newDict.set(PDFName.of("SMask"), smask);

      context.assign(ref, PDFRawStream.of(newDict, jpeg));
    } catch {
      // Any image we cannot handle is simply left untouched.
    }
  }

  onProgress({ label: `${labelPrefix}Writing optimized PDF…`, percent: 95 });
  await tick();
  return pdf.save({ useObjectStreams: true });
}

function applyGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    d[i] = d[i + 1] = d[i + 2] = y;
  }
  ctx.putImageData(img, 0, 0);
}

/* ------------------------------------------------------------------ */
/* Engine 2: adaptive per-page rasterization (maximum compression)     */
/* ------------------------------------------------------------------ */

async function rasterizeCompress(
  input: ArrayBuffer,
  targetBytes: number,
  grayscale: boolean,
  isCancelled: () => boolean,
  onProgress: (p: Progress) => void,
  labelPrefix: string
): Promise<Uint8Array> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const task = pdfjs.getDocument({ data: new Uint8Array(input) });
  const doc = await task.promise;
  const total = doc.numPages;
  const out = await PDFDocument.create();
  out.setProducer("Browser PDF Compressor");

  // Leave some room for PDF structure overhead.
  let remaining = Math.max(0, targetBytes - 30 * 1024 - total * 600);

  try {
    for (let n = 1; n <= total; n++) {
      if (isCancelled()) throw new CancelError();
      onProgress({
        label: `${labelPrefix}Compressing page ${n} of ${total}`,
        percent: Math.round(((n - 1) / total) * 100),
      });
      await tick();

      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });

      // Render once at high quality, then downscale for lower ladder steps.
      let renderScale = RASTER_BASE_DPI / 72;
      const longest = Math.max(base.width, base.height) * renderScale;
      if (longest > MAX_CANVAS_SIDE) renderScale *= MAX_CANVAS_SIDE / longest;
      const viewport = page.getViewport({ scale: renderScale });

      const hi = document.createElement("canvas");
      hi.width = Math.max(1, Math.floor(viewport.width));
      hi.height = Math.max(1, Math.floor(viewport.height));
      const hctx = hi.getContext("2d");
      if (!hctx) throw new Error("Canvas not available");
      hctx.fillStyle = "#fff";
      hctx.fillRect(0, 0, hi.width, hi.height);

      await page.render({ canvasContext: hctx, viewport, canvas: hi } as never).promise;
      page.cleanup();
      if (grayscale) applyGrayscale(hctx, hi.width, hi.height);

      const budget = remaining / (total - n + 1);
      const baseDpi = renderScale * 72;

      let chosen: Uint8Array | null = null;
      for (let s = 0; s < RASTER_LADDER.length; s++) {
        const [dpi, q] = RASTER_LADDER[s];
        const ratio = Math.min(1, dpi / baseDpi);
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(hi.width * ratio));
        c.height = Math.max(1, Math.round(hi.height * ratio));
        const cctx = c.getContext("2d");
        if (!cctx) continue;
        cctx.fillStyle = "#fff";
        cctx.fillRect(0, 0, c.width, c.height);
        cctx.imageSmoothingEnabled = true;
        cctx.imageSmoothingQuality = "high";
        cctx.drawImage(hi, 0, 0, c.width, c.height);

        const jpeg = await canvasToJpeg(c, q);
        chosen = jpeg;
        if (jpeg.length <= budget) break;
        await tick();
      }
      if (!chosen) throw new Error("Could not encode page");

      remaining -= chosen.length;
      const embedded = await out.embedJpg(chosen);
      const p = out.addPage([base.width, base.height]);
      p.drawImage(embedded, { x: 0, y: 0, width: base.width, height: base.height });

      hi.width = hi.height = 0; // free memory early
    }
  } finally {
    await task.destroy();
  }

  onProgress({ label: `${labelPrefix}Finalizing PDF…`, percent: 97 });
  await tick();
  return out.save({ useObjectStreams: true });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CompressPDFPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [mode, setMode] = useState<Mode>("auto");
  const [targetMB, setTargetMB] = useState<string>("15");
  const [grayscale, setGrayscale] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelRef.current = true;
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const clearResult = () => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  };

  const acceptFile = (file?: File) => {
    if (!file) return;
    setError(null);
    clearResult();
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setSelectedFile(null);
      setError("Please choose a PDF file (.pdf).");
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleCompress = async () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    clearResult();
    cancelRef.current = false;
    setProgress({ label: "Reading file…", percent: 0 });

    const isCancelled = () => cancelRef.current || !mountedRef.current;
    const report = (p: Progress) => {
      if (mountedRef.current) setProgress(p);
    };

    const targetNum = parseFloat(targetMB);
    const targetBytes =
      Number.isFinite(targetNum) && targetNum > 0 ? Math.round(targetNum * 1024 * 1024) : 0;

    try {
      let best: Uint8Array | null = null;
      let method = "";

      const runSmart = async (prefix: string) => {
        // With a target: walk the ladder until it fits. Without: one balanced pass.
        const levels = targetBytes ? SMART_LEVELS : [SMART_LEVELS[2]];
        let last: Uint8Array | null = null;
        for (let i = 0; i < levels.length; i++) {
          const buf = await selectedFile.arrayBuffer(); // fresh copy each pass
          const label = `${prefix}Pass ${i + 1}/${levels.length} · `;
          last = await compressEmbeddedImages(buf, levels[i], grayscale, isCancelled, report, label);
          if (!targetBytes || last.length <= targetBytes) break;
        }
        return last!;
      };

      const runRaster = async (prefix: string) => {
        const buf = await selectedFile.arrayBuffer();
        const t = targetBytes || Math.max(1024 * 1024, Math.round(selectedFile.size * 0.12));
        return rasterizeCompress(buf, t, grayscale, isCancelled, report, prefix);
      };

      if (mode === "smart") {
        best = await runSmart("");
        method = "Image recompression (text & vectors kept)";
      } else if (mode === "raster") {
        best = await runRaster("");
        method = "Adaptive page rendering (maximum compression)";
      } else {
        const smart = await runSmart("Stage 1 · ");
        best = smart;
        method = "Image recompression (text & vectors kept)";
        if (targetBytes && smart.length > targetBytes) {
          const raster = await runRaster("Stage 2 · ");
          if (raster.length < smart.length) {
            best = raster;
            method = "Adaptive page rendering (maximum compression)";
          }
        }
      }

      if (!mountedRef.current) return;

      // Never hand back something bigger than the original.
      if (best.length >= selectedFile.size) {
        best = new Uint8Array(await selectedFile.arrayBuffer());
        method = "Original kept (could not be made smaller)";
      }

      const ab = new ArrayBuffer(best.byteLength);
      new Uint8Array(ab).set(best);
      const blob = new Blob([ab], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;

      const savedBytes = selectedFile.size - blob.size;
      setResult({
        blobUrl: url,
        originalBytes: selectedFile.size,
        outputBytes: blob.size,
        savedBytes,
        savedPercent: selectedFile.size > 0 ? (savedBytes / selectedFile.size) * 100 : 0,
        method,
        hitTarget: !targetBytes || blob.size <= targetBytes,
        targetBytes,
      });
    } catch (err) {
      if (err instanceof CancelError) {
        if (mountedRef.current) setError("Compression cancelled.");
      } else {
        console.error("PDF compression failed:", err);
        if (mountedRef.current) {
          setError(
            "We could not process this PDF. It may be damaged, password-protected, or too large for this device's memory. Try an unlocked copy, or try on a desktop browser."
          );
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
        setProgress(null);
      }
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const handleReset = () => {
    cancelRef.current = true;
    clearResult();
    setSelectedFile(null);
    setError(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasSavedBytes = (result?.savedBytes ?? 0) > 0;

  const modeOptions: Array<{ id: Mode; title: string; desc: string }> = [
    {
      id: "auto",
      title: "Auto (recommended)",
      desc: "Keeps text if possible, switches to maximum compression only when needed to reach your target.",
    },
    {
      id: "smart",
      title: "Keep text & vectors",
      desc: "Recompresses embedded images only. Text stays selectable. Best quality, smaller savings on scans.",
    },
    {
      id: "raster",
      title: "Maximum compression",
      desc: "Rebuilds each page as an optimized image. Smallest files, but text is no longer selectable.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <Minimize2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Compress PDF Online — Reach Your Target Size
          </h1>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-gray-600">
            Shrink large PDFs (for example 200 MB down to 10–15 MB) with adaptive
            image recompression and per-page size budgeting. Everything runs in
            your browser, so your file is never uploaded.
          </p>
        </header>

        <section aria-labelledby="compressor-heading">
          <h2 id="compressor-heading" className="sr-only">
            Select a PDF to compress
          </h2>

          {!selectedFile ? (
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${isDragging
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300 bg-gray-50/50 hover:border-green-500"
                }`}
            >
              <input
                ref={inputRef}
                type="file"
                id="pdf-compress-upload"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label htmlFor="pdf-compress-upload" className="flex cursor-pointer flex-col items-center">
                <Upload className="mb-3 h-12 w-12 text-green-600" aria-hidden="true" />
                <span className="text-lg font-semibold text-gray-800">Choose a PDF file</span>
                <span className="mt-1 text-sm text-gray-500">or drag and drop it here</span>
                <span className="mt-3 text-xs text-gray-500">
                  PDF files only. Large files (200 MB+) are supported on desktop browsers.
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-6 w-6 shrink-0 text-green-700" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      Original size: {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="text-sm font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Choose another file
                </button>
              </div>

              {/* Target size */}
              <div className="rounded-xl border border-gray-200 p-4">
                <label htmlFor="target-size" className="block text-sm font-semibold text-gray-800">
                  Target size (MB)
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    id="target-size"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={targetMB}
                    disabled={isProcessing}
                    onChange={(e) => setTargetMB(e.target.value)}
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                  {[5, 10, 15, 25, 50].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setTargetMB(String(v))}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${targetMB === String(v)
                          ? "border-green-600 bg-green-50 text-green-800"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {v} MB
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter 0 for a single balanced pass with no size target.
                </p>
              </div>

              {/* Mode */}
              <fieldset className="grid gap-3 sm:grid-cols-3" disabled={isProcessing}>
                <legend className="sr-only">Compression mode</legend>
                {modeOptions.map((o) => (
                  <label
                    key={o.id}
                    className={`cursor-pointer rounded-xl border p-4 text-sm transition ${mode === o.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-400"
                      }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={o.id}
                      checked={mode === o.id}
                      onChange={() => setMode(o.id)}
                      className="sr-only"
                    />
                    <span className="block font-semibold text-gray-900">{o.title}</span>
                    <span className="mt-1 block leading-relaxed text-gray-600">{o.desc}</span>
                  </label>
                ))}
              </fieldset>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={grayscale}
                  disabled={isProcessing}
                  onChange={(e) => setGrayscale(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
                />
                Convert to grayscale for extra savings
              </label>

              {isProcessing && progress ? (
                <div className="rounded-xl border border-gray-200 p-4" aria-live="polite">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-gray-800">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                      <span className="truncate">{progress.label}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-600">{progress.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:underline"
                  >
                    <X className="h-4 w-4" aria-hidden="true" /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCompress}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
                >
                  Compress PDF
                </button>
              )}
            </div>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {result && selectedFile && (
          <section
            aria-labelledby="result-heading"
            className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              {hasSavedBytes && result.hitTarget ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-700" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
              )}
              <div>
                <h2 id="result-heading" className="text-lg font-bold text-gray-900">
                  {!hasSavedBytes
                    ? "This PDF could not be made smaller"
                    : result.hitTarget
                      ? "Compression complete"
                      : "Smaller, but above your target"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {hasSavedBytes
                    ? `The output is ${formatBytes(result.savedBytes)} (${result.savedPercent.toFixed(1)}%) smaller than the original.`
                    : "The original file is already well optimized, so it was kept unchanged."}
                  {hasSavedBytes && !result.hitTarget &&
                    ` Your target was ${formatBytes(result.targetBytes)}. Try "Maximum compression" mode, grayscale, or a higher target.`}
                </p>
                <p className="mt-1 text-xs text-gray-500">Method: {result.method}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-gray-500">Original</dt>
                <dd className="mt-1 font-semibold text-gray-900">{formatBytes(result.originalBytes)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Compressed</dt>
                <dd className="mt-1 font-semibold text-gray-900">{formatBytes(result.outputBytes)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Reduction</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {result.savedPercent > 0 ? "−" : "+"}
                  {Math.abs(result.savedPercent).toFixed(1)}%
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={result.blobUrl}
                download={safeDownloadName(selectedFile.name)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                Download compressed PDF
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Compress another PDF
              </button>
            </div>
          </section>
        )}

        <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              <strong>Privacy:</strong> the PDF is processed entirely in your browser
              and is never uploaded to our server. Keep a backup of the original,
              and review the result before deleting anything.
            </p>
          </div>
        </aside>
      </div>

      <ToolSeoContent
        id="compress-pdf"
        steps={[
          "Choose a PDF from your device or drag it into the upload area.",
          "Set your target size, for example 10 or 15 MB, and pick a mode. Auto is recommended.",
          "Select Compress PDF. Images are recompressed and, if needed, pages are rebuilt with a per-page size budget to reach the target.",
          "Compare the original and compressed sizes shown in the result.",
          "Download the compressed PDF. If the target was not reached, try Maximum compression or grayscale.",
        ]}
      />
    </main>
  );
}