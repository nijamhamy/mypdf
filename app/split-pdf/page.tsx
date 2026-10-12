"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { AlertCircle, Check, FileText, Scissors, ShieldCheck } from "lucide-react";
import FileDropzone from "@/components/pdf/FileDropzone";
import ProcessButton from "@/components/pdf/ProcessButton";
import ProcessingModal, { ProcessStatus } from "@/components/pdf/ProcessingModal";
import {
  formatBytes,
  bytesToBlob,
  parsePageRange,
  renderPdfThumbnails,
  uid,
} from "@/lib/pdf-utils";
import ToolSeoContent from "@/components/ToolSeoContent";

type Mode = "extract" | "delete" | "ranges" | "every";

interface Part {
  label: string;
  indices: number[];
}

interface PreviewUrl {
  url: string;
  fileId: string;
}

const MODES: { key: Mode; title: string; desc: string }[] = [
  { key: "extract", title: "Extract pages", desc: "Save chosen pages as one PDF" },
  { key: "delete", title: "Delete pages", desc: "Remove chosen pages and keep the rest" },
  { key: "ranges", title: "Split by ranges", desc: "Create one PDF for each range" },
  { key: "every", title: "Split every N pages", desc: "Divide the PDF into equal page groups" },
];

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

function selectedToRange(selected: boolean[]): string {
  if (selected.length > 0 && selected.every(Boolean)) return "";
  const parts: string[] = [];
  let index = 0;
  while (index < selected.length) {
    if (!selected[index]) {
      index++;
      continue;
    }
    let end = index;
    while (end + 1 < selected.length && selected[end + 1]) end++;
    parts.push(index === end ? `${index + 1}` : `${index + 1}-${end + 1}`);
    index = end + 1;
  }
  return parts.join(", ");
}

function parseRangeGroups(text: string, total: number): number[][] | null {
  const groups: number[][] = [];
  for (const raw of text.split(",")) {
    const part = raw.trim();
    if (!part) return null;
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return null;
    const first = Number.parseInt(match[1], 10);
    const last = match[2] ? Number.parseInt(match[2], 10) : first;
    if (first < 1 || last > total || first > last) return null;
    const group: number[] = [];
    for (let page = first; page <= last; page++) group.push(page - 1);
    groups.push(group);
  }
  return groups.length ? groups : null;
}

function describe(indices: number[]): string {
  if (!indices.length) return "No pages";
  const first = indices[0] + 1;
  const last = indices[indices.length - 1] + 1;
  const contiguous = indices.every((value, index) => index === 0 || value === indices[index - 1] + 1);
  if (indices.length === 1) return `Page ${first}`;
  return contiguous ? `Pages ${first}–${last}` : `${indices.length} selected pages`;
}

function makeSafeBaseName(name: string): string {
  return name.trim().replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "_") || "split";
}

export default function SplitPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<boolean[]>([]);
  const [pageRange, setPageRange] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("extract");
  const [rangesText, setRangesText] = useState("");
  const [everyN, setEveryN] = useState(1);
  const [outName, setOutName] = useState("split");
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("split.pdf");
  const [modalError, setModalError] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<{ outputs: number; pages: number; bytes: number } | null>(null);
  const cancelRef = useRef(false);
  const mountedRef = useRef(false);
  const loadTokenRef = useRef(0);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      loadTokenRef.current++;
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  const loadFile = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    const isPdf = picked.type === "application/pdf" || /\.pdf$/i.test(picked.name);
    if (!isPdf) {
      setLoadError("Choose a PDF file (.pdf). Other file types are not supported.");
      return;
    }

    const token = ++loadTokenRef.current;
    setLoadError(null);
    setThumbs({});
    setSelected([]);
    setPageRange("");
    setRangesText("");
    setResult(null);
    setResultInfo(null);

    try {
      const doc = await PDFDocument.load(await picked.arrayBuffer());
      if (!mountedRef.current || token !== loadTokenRef.current) return;
      const count = doc.getPageCount();
      if (count < 1) throw new Error("empty");
      setFile(picked);
      setPageCount(count);
      setSelected(Array(count).fill(false));
      setEveryN(1);
      setOutName(`${makeSafeBaseName(picked.name)}-split`);

      renderPdfThumbnails(
        picked,
        (index, url) => {
          if (!mountedRef.current || token !== loadTokenRef.current) {
            URL.revokeObjectURL(url);
            return;
          }
          previewUrlsRef.current.add(url);
          setThumbs((previous) => ({ ...previous, [index]: url }));
        },
        () => !mountedRef.current || token !== loadTokenRef.current,
        130
      ).catch(() => {
        if (mountedRef.current && token === loadTokenRef.current) {
          setLoadError("Page previews could not be created, but page-range splitting may still work.");
        }
      });
    } catch (caught) {
      console.error("PDF load failed:", caught);
      if (mountedRef.current && token === loadTokenRef.current) {
        setFile(null);
        setPageCount(0);
        setLoadError("This PDF could not be opened. It may be damaged or password-protected. This tool cannot decrypt protected PDFs.");
      }
    }
  };

  const pageRangeInvalid = pageRange.trim() !== "" && parsePageRange(pageRange, pageCount) === null;

  const onPageRangeChange = (value: string) => {
    setPageRange(value);
    if (!value.trim()) {
      setSelected(Array(pageCount).fill(false));
      return;
    }
    const parsed = parsePageRange(value, pageCount);
    if (parsed) {
      const next = Array(pageCount).fill(false);
      parsed.forEach((pageIndex) => { next[pageIndex] = true; });
      setSelected(next);
    }
  };

  const togglePage = (index: number) => {
    const next = [...selected];
    next[index] = !next[index];
    setSelected(next);
    setPageRange(selectedToRange(next));
  };

  const setAll = (value: boolean) => {
    setSelected(Array(pageCount).fill(value));
    setPageRange(value && pageCount ? `1-${pageCount}` : "");
  };

  const selectedIdx = useMemo(
    () => selected.map((isSelected, index) => isSelected ? index : -1).filter((index) => index >= 0),
    [selected]
  );

  const { parts, planError } = useMemo((): { parts: Part[]; planError: string | null } => {
    if (!pageCount) return { parts: [], planError: null };

    if (mode === "extract") {
      if (pageRangeInvalid) return { parts: [], planError: `Enter valid page numbers from 1 to ${pageCount}, for example 1-3, 5.` };
      if (!selectedIdx.length) return { parts: [], planError: null };
      return { parts: [{ label: describe(selectedIdx), indices: selectedIdx }], planError: null };
    }

    if (mode === "delete") {
      if (pageRangeInvalid) return { parts: [], planError: `Enter valid page numbers from 1 to ${pageCount}, for example 1-3, 5.` };
      if (!selectedIdx.length) return { parts: [], planError: null };
      if (selectedIdx.length >= pageCount) return { parts: [], planError: "You cannot delete every page. Keep at least one page." };
      const keep = Array.from({ length: pageCount }, (_, index) => index).filter((index) => !selected[index]);
      return { parts: [{ label: `${keep.length} remaining pages`, indices: keep }], planError: null };
    }

    if (mode === "ranges") {
      if (!rangesText.trim()) return { parts: [], planError: null };
      const groups = parseRangeGroups(rangesText, pageCount);
      if (!groups) return { parts: [], planError: `Enter ranges between 1 and ${pageCount}, such as 1-3, 4-6, 8. Avoid empty ranges.` };
      return { parts: groups.map((group) => ({ label: describe(group), indices: group })), planError: null };
    }

    const groupSize = Math.max(1, Math.min(Number.isFinite(everyN) ? everyN : 1, pageCount));
    const output: Part[] = [];
    for (let start = 0; start < pageCount; start += groupSize) {
      const indices = Array.from({ length: Math.min(groupSize, pageCount - start) }, (_, offset) => start + offset);
      output.push({ label: describe(indices), indices });
    }
    return { parts: output, planError: null };
  }, [mode, pageCount, selectedIdx, selected, pageRangeInvalid, rangesText, everyN]);

  const canRun = Boolean(file) && parts.length > 0 && !planError && status !== "processing";
  const showGrid = mode === "extract" || mode === "delete";
  const ctaLabel = parts.length > 1
    ? `Split into ${parts.length} PDFs (ZIP)`
    : mode === "delete"
      ? "Delete selected pages and save PDF"
      : "Create PDF";

  const handleRun = async () => {
    if (!file || !canRun) return;
    cancelRef.current = false;
    setResult(null);
    setResultInfo(null);
    setModalError(null);
    setProgress(0);
    setMessage("Reading the PDF...");
    setStatus("processing");
    await tick();

    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const base = makeSafeBaseName(outName);
      const pad = String(parts.length).length;
      const multi = parts.length > 1;
      const outputs: { name: string; blob: Blob; pages: number }[] = [];

      for (let index = 0; index < parts.length; index++) {
        if (cancelRef.current) return;
        const part = parts[index];
        setMessage(multi ? `Creating part ${index + 1} of ${parts.length}: ${part.label}` : `Creating ${part.label.toLowerCase()}...`);
        const output = await PDFDocument.create();
        const copied = await output.copyPages(source, part.indices);
        copied.forEach((page) => output.addPage(page));
        const bytes = await output.save();
        const name = multi ? `${base}-part-${String(index + 1).padStart(pad, "0")}.pdf` : `${base}.pdf`;
        outputs.push({ name, blob: bytesToBlob(bytes), pages: copied.length });
        setProgress(((index + 1) / parts.length) * (multi ? 82 : 92));
        await tick();
      }

      if (cancelRef.current) return;
      let finalBlob: Blob;
      let finalName: string;
      if (outputs.length === 1) {
        finalBlob = outputs[0].blob;
        finalName = outputs[0].name;
      } else {
        setMessage(`Packaging ${outputs.length} PDF files into a ZIP...`);
        setProgress(85);
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        outputs.forEach((output) => zip.file(output.name, output.blob));
        finalBlob = await zip.generateAsync(
          { type: "blob", compression: "STORE" },
          (metadata) => {
            if (!cancelRef.current) setProgress(85 + metadata.percent * 0.14);
          }
        );
        finalName = `${base}.zip`;
      }

      if (cancelRef.current) return;
      setResult(finalBlob);
      setResultName(finalName);
      setResultInfo({ outputs: outputs.length, pages: outputs.reduce((sum, output) => sum + output.pages, 0), bytes: finalBlob.size });
      setProgress(100);
      setMessage("Your result is ready.");
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (mountedRef.current && !cancelRef.current) setStatus("done");
    } catch (caught) {
      console.error("PDF split failed:", caught);
      setModalError("Could not split this PDF. It may be damaged, password-protected, or use features this browser tool cannot read. Try an unlocked PDF and check that at least one page is selected.");
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

  const resetAll = () => {
    cancelRef.current = true;
    loadTokenRef.current++;
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setFile(null);
    setThumbs({});
    setSelected([]);
    setPageCount(0);
    setPageRange("");
    setRangesText("");
    setEveryN(1);
    setOutName("split");
    setResult(null);
    setResultInfo(null);
    setStatus("idle");
    setProgress(0);
    setMessage("");
    setModalError(null);
    setLoadError(null);
  };

  const inputCls = "rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Scissors className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Split or Extract PDF Pages Online</h1>
          <p className="mx-auto mt-3 max-w-3xl leading-relaxed text-gray-600">
            Choose whether to extract selected pages, remove unwanted pages, divide a document by page ranges, or split it into equal page groups. Preview the planned output before creating it. Files are processed in this browser; this tool does not upload them to our server for splitting.
          </p>
        </header>

        <section aria-labelledby="split-tool-heading">
          <h2 id="split-tool-heading" className="sr-only">Choose a PDF split operation</h2>
          {!file ? (
            <div>
              <FileDropzone onFiles={loadFile} multiple={false} label="Choose one PDF file" />
              <p className="mt-3 text-center text-sm text-gray-500">After selecting a PDF, choose an operation and review the page ranges before creating the output.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">{file.name}</p>
                    <p className="text-xs text-blue-800">{pageCount} {pageCount === 1 ? "page" : "pages"} · {formatBytes(file.size)}</p>
                  </div>
                </div>
                <button type="button" onClick={resetAll} className="shrink-0 text-sm font-medium text-red-700 underline-offset-2 hover:underline">Choose another PDF</button>
              </div>

              <section aria-labelledby="mode-heading">
                <h2 id="mode-heading" className="mb-3 text-lg font-bold text-gray-900">Choose what to do</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {MODES.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setMode(item.key)}
                      aria-pressed={mode === item.key}
                      className={`rounded-xl border-2 p-4 text-left transition ${mode === item.key ? "border-blue-700 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                    >
                      <span className="block text-sm font-bold text-gray-900">{item.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-600">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              {showGrid && (
                <section aria-labelledby="page-selection-heading" className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="page-selection-heading" className="text-sm font-bold text-gray-900">
                      {mode === "extract" ? "Pages to extract" : "Pages to delete"} ({selectedIdx.length} selected)
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="split-page-range" className="sr-only">Enter page numbers or ranges</label>
                      <input
                        id="split-page-range"
                        value={pageRange}
                        onChange={(event) => onPageRangeChange(event.target.value)}
                        placeholder={`e.g. 1-3, ${Math.min(5, pageCount)}`}
                        aria-invalid={pageRangeInvalid}
                        aria-describedby={pageRangeInvalid ? "page-range-error" : undefined}
                        className={`${inputCls} w-full sm:w-52 ${pageRangeInvalid ? "border-red-500" : "border-gray-300"}`}
                      />
                      <button type="button" onClick={() => setAll(true)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-100">Select all</button>
                      <button type="button" onClick={() => setAll(false)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-100">Clear selection</button>
                    </div>
                  </div>
                  {pageRangeInvalid && <p id="page-range-error" className="mb-3 text-sm text-red-700" role="alert">Enter pages from 1 to {pageCount}, such as 1-3, 5.</p>}
                  <p className="mb-3 text-xs leading-relaxed text-gray-600">In Extract mode, selected pages are copied to a new PDF. In Delete mode, selected pages are removed and the other pages are kept.</p>
                  <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {selected.map((isSelected, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => togglePage(index)}
                        aria-pressed={isSelected}
                        aria-label={`${isSelected ? "Deselect" : "Select"} page ${index + 1}`}
                        className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border-2 bg-white ${isSelected ? (mode === "delete" ? "border-red-600 opacity-60" : "border-blue-600") : "border-gray-200"}`}
                      >
                        {thumbs[index] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbs[index]} alt={`Preview of page ${index + 1}`} className="h-full w-full object-contain" draggable={false} />
                        ) : (
                          <span className="px-2 text-center text-xs text-gray-500">Preview loading or unavailable</span>
                        )}
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">Page {index + 1}</span>
                        {isSelected && <span className={`absolute right-1 top-1 rounded-full p-0.5 text-white ${mode === "delete" ? "bg-red-700" : "bg-blue-700"}`}><Check className="h-3 w-3" /></span>}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {mode === "ranges" && (
                <section aria-labelledby="ranges-heading" className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h2 id="ranges-heading" className="mb-2 text-sm font-bold text-gray-900">Page ranges (each comma-separated range becomes a separate PDF)</h2>
                  <label htmlFor="split-ranges" className="sr-only">Page ranges</label>
                  <input id="split-ranges" value={rangesText} onChange={(event) => setRangesText(event.target.value)} placeholder="Example: 1-3, 4-6, 8" aria-invalid={Boolean(planError)} className={`${inputCls} w-full ${planError ? "border-red-500" : "border-gray-300"}`} />
                  <p className="mt-2 text-xs text-gray-600">Example: `1-3, 4-6, 8` creates three PDFs: pages 1–3, pages 4–6, and page 8.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { label: "First half / second half", value: `1-${Math.ceil(pageCount / 2)}, ${Math.ceil(pageCount / 2) + 1}-${pageCount}`, disabled: pageCount < 2 },
                      { label: "Page 1 / remaining pages", value: `1, 2-${pageCount}`, disabled: pageCount < 2 },
                    ].map((preset) => (
                      <button type="button" key={preset.label} disabled={preset.disabled} onClick={() => setRangesText(preset.value)} className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-40">{preset.label}</button>
                    ))}
                  </div>
                </section>
              )}

              {mode === "every" && (
                <section aria-labelledby="every-heading" className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h2 id="every-heading" className="mb-2 text-sm font-bold text-gray-900">Pages in each output PDF</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="pages-per-file" className="sr-only">Pages per output file</label>
                    <input id="pages-per-file" type="number" min={1} max={pageCount} value={everyN} onChange={(event) => setEveryN(Math.max(1, Math.min(pageCount, Number.parseInt(event.target.value || "1", 10))))} className={`${inputCls} w-28 border-gray-300`} />
                    {[1, 2, 5, 10].filter((number) => number <= pageCount).map((number) => (
                      <button type="button" key={number} onClick={() => setEveryN(number)} aria-pressed={everyN === number} className={`rounded-lg border px-3 py-1.5 text-xs ${everyN === number ? "border-blue-700 bg-blue-700 text-white" : "bg-white hover:bg-gray-100"}`}>{number === 1 ? "One page per file" : `${number} pages per file`}</button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">The last output file may contain fewer pages if the page count is not divisible by this number.</p>
                </section>
              )}

              {planError && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert"><AlertCircle className="h-5 w-5 shrink-0" /><span>{planError}</span></div>}

              {parts.length > 0 && (
                <section aria-labelledby="result-plan-heading" className="rounded-2xl border border-gray-200 bg-white p-4">
                  <h2 id="result-plan-heading" className="mb-2 text-sm font-bold text-gray-900">Output preview: {parts.length} {parts.length === 1 ? "PDF file" : "PDF files in a ZIP"}</h2>
                  <ul className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                    {parts.slice(0, 60).map((part, index) => (
                      <li key={`${index}-${part.label}`} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800">
                        <span className="font-semibold">{parts.length > 1 ? `File ${index + 1}` : "Output"}</span> · {part.label} · {part.indices.length} {part.indices.length === 1 ? "page" : "pages"}
                      </li>
                    ))}
                  </ul>
                  {parts.length > 60 && <p className="mt-2 text-xs text-gray-600">And {parts.length - 60} additional output files.</p>}
                  <p className="mt-3 text-xs text-gray-600">Review this plan before creating the files. Multiple outputs are packaged into a ZIP download.</p>
                </section>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor="split-output-name" className="sr-only">Output file name</label>
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 sm:w-72">
                  <input id="split-output-name" value={outName} onChange={(event) => setOutName(event.target.value)} className="min-w-0 flex-1 px-3 py-3 text-sm focus:outline-none" placeholder="File name" />
                  <span className="bg-gray-50 px-3 py-3 text-sm text-gray-600">{parts.length > 1 ? ".zip" : ".pdf"}</span>
                </div>
                <div className="flex-1"><ProcessButton onClick={handleRun} loading={status === "processing"} disabled={!canRun} label={ctaLabel} loadingLabel="Creating PDF files…" /></div>
              </div>
            </div>
          )}

          {loadError && <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertCircle className="h-5 w-5 shrink-0" /><span>{loadError}</span></div>}
        </section>

        {resultInfo && status === "done" && (
          <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4" aria-live="polite">
            <h2 className="font-semibold text-green-950">Your PDF output is ready</h2>
            <p className="mt-1 text-sm text-green-900">Created {resultInfo.outputs} {resultInfo.outputs === 1 ? "file" : "files"}, containing {resultInfo.pages} selected pages. Download size: {formatBytes(resultInfo.bytes)}.</p>
            <p className="mt-1 text-xs text-green-900">Open and check the downloaded PDF or ZIP before sharing it.</p>
          </section>
        )}

        <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
          <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p><strong>Privacy and file limitations:</strong> the selected PDF is processed in your browser for this operation and is not uploaded to our server. Password-protected or damaged PDFs may not open; this tool does not decrypt password-protected files.</p></div>
        </aside>
      </div>

      <ProcessingModal status={status} progress={progress} title="Creating your PDF output" message={message} blob={result} filename={resultName} errorMessage={modalError} onCancel={handleCancel} onClose={closeModal} onReset={resetAll} />

      <ToolSeoContent
        id="split-pdf"
        steps={[
          "Choose one PDF from your device. The page count and file size appear after it opens.",
          "Choose Extract pages to create a PDF from selected pages, Delete pages to remove selected pages, Split by ranges to make one PDF per range, or Split every N pages to divide it into equal groups.",
          "For Extract or Delete, select page thumbnails or enter a range such as 1-3, 5. For range splitting, enter comma-separated groups such as 1-3, 4-6, 8.",
          "Review the output preview, including each file's page range and page count. Multiple output PDFs are packaged into one ZIP.",
          "Choose an output name, run the operation, and open the downloaded PDF or ZIP to verify its pages.",
        ]}
      />
    </main>
  );
}
