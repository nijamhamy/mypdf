"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { PDFDocument } from "pdf-lib";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Minimize2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import ToolSeoContent from "@/components/ToolSeoContent";

type ResultInfo = {
  blobUrl: string;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
};

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
  return `${base || "document"}-optimized.pdf`;
}

export default function CompressPDFPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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

  const handleOptimize = async () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    clearResult();

    try {
      const inputBytes = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(inputBytes);
      const outputBytes = await pdf.save({ useObjectStreams: true });

      // Copy into a standalone ArrayBuffer for compatibility with current TS DOM BlobPart types.
      const safeArrayBuffer = new ArrayBuffer(outputBytes.byteLength);
      new Uint8Array(safeArrayBuffer).set(outputBytes);

      const blob = new Blob([safeArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      if (!mountedRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      resultUrlRef.current = url;
      const savedBytes = selectedFile.size - blob.size;
      setResult({
        blobUrl: url,
        originalBytes: selectedFile.size,
        outputBytes: blob.size,
        savedBytes,
        savedPercent: selectedFile.size > 0 ? (savedBytes / selectedFile.size) * 100 : 0,
      });
    } catch (err) {
      console.error("PDF optimization failed:", err);
      setError(
        "We could not process this PDF. It may be damaged, encrypted, or use features this browser tool cannot read. Try an unlocked copy or another PDF."
      );
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  const handleReset = () => {
    clearResult();
    setSelectedFile(null);
    setError(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasSavedBytes = (result?.savedBytes ?? 0) > 0;
  const sizeChanged = result ? result.savedBytes !== 0 : false;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <Minimize2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Optimize PDF Online — Compare File Size
          </h1>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-gray-600">
            Re-save a PDF with compact object streams and compare the output size
            before downloading. This browser-based structural optimization keeps
            page content intact, but it does not re-compress embedded photos or
            scans, so the size reduction depends on the PDF.
          </p>
        </header>

        <section aria-labelledby="optimizer-heading">
          <h2 id="optimizer-heading" className="sr-only">
            Select a PDF to optimize
          </h2>

          {!selectedFile ? (
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
                isDragging
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300 bg-gray-50/50 hover:border-green-500"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                id="pdf-optimize-upload"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label
                htmlFor="pdf-optimize-upload"
                className="flex cursor-pointer flex-col items-center"
              >
                <Upload className="mb-3 h-12 w-12 text-green-600" aria-hidden="true" />
                <span className="text-lg font-semibold text-gray-800">
                  Choose a PDF file
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  or drag and drop it here
                </span>
                <span className="mt-3 text-xs text-gray-500">
                  PDF files only. Processing happens in this browser.
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-6 w-6 shrink-0 text-green-700" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Original size: {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm font-medium text-red-700 underline-offset-2 hover:underline"
                >
                  Choose another file
                </button>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
                <p className="font-semibold">What this optimizer does</p>
                <p className="mt-1">
                  It loads and re-saves the PDF with object streams enabled. This
                  may reduce structural overhead in some files. It does not lower
                  image quality or resize embedded images; image-heavy PDFs may
                  stay nearly the same size or occasionally become larger.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOptimize}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>Optimizing PDF…</span>
                  </>
                ) : (
                  <span>Optimize and compare PDF</span>
                )}
              </button>
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
              {hasSavedBytes ? (
                <CheckCircle2
                  className="mt-0.5 h-6 w-6 shrink-0 text-green-700"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="mt-0.5 h-6 w-6 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
              )}
              <div>
                <h2 id="result-heading" className="text-lg font-bold text-gray-900">
                  {hasSavedBytes
                    ? "Output file is smaller"
                    : result.savedBytes < 0
                      ? "Output file is larger"
                      : "File size is unchanged"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {hasSavedBytes
                    ? `The output is ${formatBytes(result.savedBytes)} (${result.savedPercent.toFixed(1)}%) smaller than the original.`
                    : result.savedBytes < 0
                      ? `The output is ${formatBytes(Math.abs(result.savedBytes))} larger. This can happen because re-saving does not recompress embedded images.`
                      : "The output size is the same. This PDF may already be optimized or may contain mostly images."}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-gray-500">Original</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {formatBytes(result.originalBytes)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Optimized output</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {formatBytes(result.outputBytes)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Size change</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {sizeChanged
                    ? `${result.savedPercent > 0 ? "−" : "+"}${Math.abs(result.savedPercent).toFixed(1)}%`
                    : "0%"}
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
                Download optimized PDF
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Optimize another PDF
              </button>
            </div>
          </section>
        )}

        <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              <strong>Privacy:</strong> the PDF is read and processed in your
              browser. This page does not upload the selected document to our
              server for this operation. Do not use this tool as a substitute for
              reviewing sensitive files or keeping a backup.
            </p>
          </div>
        </aside>
      </div>

      <ToolSeoContent
        id="compress-pdf"
        steps={[
          "Choose a PDF from your device or drag it into the upload area.",
          "Check the original file size shown beside the selected file.",
          "Select Optimize and compare PDF. The tool re-saves the document with PDF object streams enabled; it does not resize or recompress its embedded images.",
          "Compare the original and output sizes, including the displayed size change.",
          "If the output is smaller, download it. If it is unchanged or larger, the original may already be optimized or may contain image-heavy pages; keep whichever version suits your needs.",
        ]}
      />
    </main>
  );
}
