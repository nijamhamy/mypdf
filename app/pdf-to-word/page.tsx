"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, FileOutput, FileText, Info, ShieldCheck } from "lucide-react";
import FileDropzone from "@/components/pdf/FileDropzone";
import ProcessButton from "@/components/pdf/ProcessButton";
import ProcessingModal, { ProcessStatus } from "@/components/pdf/ProcessingModal";
import ToolSeoContent from "@/components/ToolSeoContent";
import { formatBytes, parsePageRange, renderPdfThumbnails } from "@/lib/pdf-utils";

type Mode = "text" | "ocr" | "image";
type FontMode = "smart" | "original";

const MODES: { key: Mode; title: string; desc: string }[] = [
  { key: "text", title: "Editable text", desc: "Rebuild selectable text and supported layout" },
  { key: "ocr", title: "Scanned PDF (OCR)", desc: "Recognize text on scanned page images" },
  { key: "image", title: "Page images", desc: "Place each page as an image in Word" },
];

const LANGS: { code: string; label: string }[] = [
  { code: "eng", label: "English" }, { code: "ara", label: "Arabic" }, { code: "tam", label: "Tamil" },
  { code: "urd", label: "Urdu" }, { code: "fas", label: "Persian (Farsi)" }, { code: "heb", label: "Hebrew" },
  { code: "hin", label: "Hindi" }, { code: "ben", label: "Bengali" }, { code: "tel", label: "Telugu" },
  { code: "kan", label: "Kannada" }, { code: "mal", label: "Malayalam" }, { code: "guj", label: "Gujarati" },
  { code: "pan", label: "Punjabi" }, { code: "mar", label: "Marathi" }, { code: "nep", label: "Nepali" },
  { code: "sin", label: "Sinhala" }, { code: "tha", label: "Thai" }, { code: "vie", label: "Vietnamese" },
  { code: "ind", label: "Indonesian" }, { code: "msa", label: "Malay" }, { code: "chi_sim", label: "Chinese (Simplified)" },
  { code: "chi_tra", label: "Chinese (Traditional)" }, { code: "jpn", label: "Japanese" }, { code: "kor", label: "Korean" },
  { code: "rus", label: "Russian" }, { code: "ukr", label: "Ukrainian" }, { code: "ell", label: "Greek" },
  { code: "tur", label: "Turkish" }, { code: "fra", label: "French" }, { code: "deu", label: "German" },
  { code: "spa", label: "Spanish" }, { code: "por", label: "Portuguese" }, { code: "ita", label: "Italian" },
  { code: "nld", label: "Dutch" }, { code: "pol", label: "Polish" }, { code: "swe", label: "Swedish" },
  { code: "ces", label: "Czech" }, { code: "ron", label: "Romanian" }, { code: "hun", label: "Hungarian" },
  { code: "fin", label: "Finnish" },
];

const RTL_LANGS = new Set(["ara", "fas", "urd", "heb"]);
const CJK_LANGS = new Set(["chi_sim", "chi_tra", "jpn"]);
const FONTS = ["Calibri", "Arial", "Times New Roman", "Georgia", "Verdana"];
const RS = 2;

const NUM_RE = /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i;
const BULLET_RE = /^([•●▪◦■□▶►*]|[-–—])\s+/;
const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const RTL_G = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const LETTER_G = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u08FF\u0900-\u0DFF\u0E00-\u0E7F\u3040-\u9FFF\uAC00-\uD7AF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const MARK_ONLY_RE = /^[\u0300-\u036F\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08FF]+$/;
const LEGACY_RE = /bamini|vanavil|tscii|tace|shree|kavipriya|saraswati|amudham|inaimathi|nakkeeran|elango|mylai|kruti|devlys|chanakya|walkman|sun-?tommy|kalaham|aruna|\btab\b|tamil|\btam\b/i;

const tick = () => new Promise<void>((r) => setTimeout(r, 20));
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function selectedToRange(sel: boolean[]): string {
  if (sel.length > 0 && sel.every(Boolean)) return "";
  const parts: string[] = [];
  let i = 0;
  while (i < sel.length) {
    if (!sel[i]) { i++; continue; }
    let j = i;
    while (j + 1 < sel.length && sel[j + 1]) j++;
    parts.push(i === j ? `${i + 1}` : `${i + 1}-${j + 1}`);
    i = j + 1;
  }
  return parts.join(", ");
}

function safeBaseName(value: string): string {
  return value.trim().replace(/\.docx$/i, "").replace(/[\\/:*?"<>|]/g, "_") || "converted";
}

async function openPdf(file: File) {
  const pdfjs: any = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  const task: any = pdfjs.getDocument({ data });
  const doc: any = await task.promise;
  return { doc, task, pdfjs };
}

async function renderToCanvas(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
  return canvas;
}

function canvasToBytes(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (b) => {
      if (!b) return reject(new Error("Export failed"));
      resolve(new Uint8Array(await b.arrayBuffer()));
    }, type, quality);
  });
}

/* ---------- fonts ---------- */

async function fontMap(page: any, items: any[], opList?: any): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (!opList) { try { await page.getOperatorList(); } catch { /* font names are optional */ } }
  const names = Array.from(new Set<string>(items.map((i) => i.fontName).filter(Boolean)));
  for (const n of names) {
    try {
      if (page.commonObjs.has(n)) {
        const f = page.commonObjs.get(n);
        map[n] = String(f?.name || "");
      }
    } catch { /* ignore */ }
  }
  return map;
}

function parseFont(raw: string) {
  if (!raw || /^g_d\d+_f\d+$/.test(raw)) return { family: "", bold: false, italic: false };
  let n = raw.replace(/^[A-Z]{6}\+/, "");
  const bold = /bold|black|heavy|semibold|demi/i.test(n);
  const italic = /italic|oblique/i.test(n);
  n = n.split(/[-,]/)[0].replace(/(PSMT|MT|PS)$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return { family: n, bold, italic };
}

function scriptFont(s: string): string | null {
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/.test(s)) return "Times New Roman";
  if (/[\u0900-\u0DFF]/.test(s)) return "Nirmala UI";
  if (/[\u0E00-\u0E7F]/.test(s)) return "Tahoma";
  if (/[\u3040-\u30FF]/.test(s)) return "Yu Gothic";
  if (/[\uAC00-\uD7AF]/.test(s)) return "Malgun Gothic";
  if (/[\u4E00-\u9FFF]/.test(s)) return "Microsoft YaHei";
  return null;
}

interface Run { text: string; font: string; bold: boolean; italic: boolean; size: number }

function pickFont(r: Run, base: string, mode: FontMode): string {
  if (mode === "original" && r.font) return r.font;
  const sf = scriptFont(r.text);
  if (sf) return sf;
  if (r.font && LEGACY_RE.test(r.font)) return r.font;
  return base;
}

const norm = (s: string) =>
  s.replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]+/g, (m) => m.normalize("NFKC")).normalize("NFC");

/* ---------- text -> lines ---------- */

interface Ln { y: number; x0: number; x1: number; start: number; size: number; text: string; rtl: boolean; runs: Run[] }

function extractLines(items: any[], fonts: Record<string, string>, pageW: number): Ln[] {
  type Tok = { str: string; x: number; y: number; w: number; size: number; font: string; bold: boolean; italic: boolean };
  const toks: Tok[] = items
    .filter((i) => typeof i.str === "string" && i.str !== "")
    .map((i) => {
      const f = parseFont(fonts[i.fontName] || "");
      return {
        str: i.str as string,
        x: i.transform[4] as number,
        y: i.transform[5] as number,
        w: (i.width as number) || 0,
        size: Math.hypot(i.transform[2], i.transform[3]) || (i.height as number) || 10,
        font: f.family, bold: f.bold, italic: f.italic,
      };
    })
    .sort((a, b) => (Math.abs(b.y - a.y) > 0.5 ? b.y - a.y : a.x - b.x));

  const rows: { y: number; toks: Tok[] }[] = [];
  for (const t of toks) {
    const cur = rows[rows.length - 1];
    if (cur && Math.abs(cur.y - t.y) <= Math.max(2, t.size * 0.4)) cur.toks.push(t);
    else rows.push({ y: t.y, toks: [t] });
  }

  const out: Ln[] = [];
  for (const row of rows) {
    const bases = row.toks.filter((t) => !MARK_ONLY_RE.test(t.str));
    const marks = row.toks.filter((t) => MARK_ONLY_RE.test(t.str));
    if (bases.length) {
      for (const m of marks) {
        let best = bases[0];
        let d = Infinity;
        const mc = m.x + m.w / 2;
        for (const b of bases) {
          const dd = Math.abs(b.x + b.w / 2 - mc);
          if (dd < d) { d = dd; best = b; }
        }
        best.str += m.str;
      }
    }
    const rt = bases.length ? bases : marks;
    if (!rt.length) continue;

    const joined = rt.map((t) => t.str).join("");
    const rtlCount = (joined.match(RTL_G) || []).length;
    const letters = (joined.match(LETTER_G) || []).length;
    const rtl = letters > 0 && rtlCount / letters > 0.5;
    rt.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));

    const runs: Run[] = [];
    const add = (text: string, t: Tok) => {
      const last = runs[runs.length - 1];
      if (last && last.font === t.font && last.bold === t.bold && last.italic === t.italic && Math.abs(last.size - t.size) < 0.6) {
        last.text += text;
      } else {
        runs.push({ text, font: t.font, bold: t.bold, italic: t.italic, size: t.size });
      }
    };

    let prev: Tok | null = null;
    for (const t of rt) {
      if (prev) {
        const gap = rtl ? prev.x - (t.x + t.w) : t.x - (prev.x + prev.w);
        const lastText = runs[runs.length - 1].text;
        if (gap > t.size * 3) add("    ", t);
        else if (gap > t.size * 0.12 && !/\s$/.test(lastText) && !/^\s/.test(t.str)) add(" ", t);
      }
      add(t.str, t);
      prev = t;
    }

    runs.forEach((r) => { r.text = norm(r.text); });
    if (runs.length) {
      runs[0].text = runs[0].text.replace(/^\s+/, "");
      const l = runs[runs.length - 1];
      l.text = l.text.replace(/\s+$/, "");
    }
    const text = runs.map((r) => r.text).join("");
    if (!text.trim()) continue;

    const main = rt.reduce((a, b) => (b.str.trim().length > a.str.trim().length ? b : a), rt[0]);
    const x0 = Math.min(...rt.map((t) => t.x));
    const x1 = Math.max(...rt.map((t) => t.x + t.w));
    out.push({ y: row.y, x0, x1, start: rtl ? pageW - x1 : x0, size: main.size, text, rtl, runs });
  }
  return out;
}

/* ---------- lines -> blocks ---------- */

interface Block {
  kind: "h" | "p" | "li";
  level: 1 | 2 | 3;
  runs: Run[];
  text: string;
  size: number;
  center: boolean;
  rtl: boolean;
  top: number;
  lastStart: number;
  lastY: number;
}

const runsText = (r: Run[]) => r.map((x) => x.text).join("");

function joinRuns(a: Run[], b: Run[]): Run[] {
  const A = a.map((r) => ({ ...r }));
  const B = b.map((r) => ({ ...r }));
  const lastA = A[A.length - 1];
  if (lastA && B[0] && /[A-Za-z\u00C0-\u024F]-$/.test(lastA.text) && /^[a-z]/.test(B[0].text)) {
    lastA.text = lastA.text.slice(0, -1);
  } else if (lastA) {
    lastA.text += " ";
  }
  return [...A, ...B];
}

function linesToBlocks(
  lines: Ln[], pageW: number, pageH: number, body: number,
  opts: { headings: boolean; keepBreaks: boolean; removeNums: boolean }
): Block[] {
  const out: Block[] = [];
  const centered = (l: Ln) =>
    Math.abs((l.x0 + l.x1) / 2 - pageW / 2) < pageW * 0.03 && l.x0 > pageW * 0.12 && l.x1 - l.x0 < pageW * 0.7;

  for (const L of lines) {
    if (opts.removeNums && NUM_RE.test(L.text) && (L.y < pageH * 0.1 || L.y > pageH * 0.9)) continue;
    const prev = out[out.length - 1];
    const gap = prev ? prev.lastY - L.y : Infinity;
    const fresh = (kind: Block["kind"], level: 1 | 2 | 3, runs: Run[]): Block => ({
      kind, level, runs, text: runsText(runs), size: L.size,
      center: kind === "li" ? false : centered(L), rtl: L.rtl,
      top: pageH - L.y - L.size * 0.8, lastStart: L.start, lastY: L.y,
    });

    const heading = opts.headings && L.size >= body * 1.25 && L.text.length <= 140;
    if (heading) {
      const level: 1 | 2 | 3 = L.size >= body * 1.8 ? 1 : L.size >= body * 1.5 ? 2 : 3;
      if (prev && prev.kind === "h" && Math.abs(prev.size - L.size) < 1 && gap <= L.size * 1.6) {
        prev.runs = joinRuns(prev.runs, L.runs);
        prev.text = runsText(prev.runs);
        prev.lastY = L.y;
      } else {
        out.push(fresh("h", level, L.runs.map((r) => ({ ...r }))));
      }
      continue;
    }

    if (BULLET_RE.test(L.text)) {
      const rs = L.runs.map((r) => ({ ...r }));
      rs[0].text = rs[0].text.replace(BULLET_RE, "");
      out.push(fresh("li", 1, rs));
      continue;
    }

    if (prev && prev.kind === "li" && L.start > prev.lastStart + 1 && gap <= L.size * 1.5) {
      prev.runs = joinRuns(prev.runs, L.runs);
      prev.text = runsText(prev.runs);
      prev.lastY = L.y;
      continue;
    }

    const canMerge =
      prev && prev.kind === "p" && !opts.keepBreaks && !prev.center &&
      gap <= L.size * 1.5 && Math.abs(prev.size - L.size) < 1.2 &&
      L.start <= prev.lastStart + L.size * 1.5;

    if (canMerge && prev) {
      prev.runs = joinRuns(prev.runs, L.runs);
      prev.text = runsText(prev.runs);
      prev.lastStart = L.start;
      prev.lastY = L.y;
    } else {
      out.push(fresh("p", 1, L.runs.map((r) => ({ ...r }))));
    }
  }
  return out;
}

function bodySizeOf(all: Ln[][]): number {
  const bucket = new Map<number, number>();
  for (const page of all)
    for (const l of page) {
      const k = Math.round(l.size * 2) / 2;
      bucket.set(k, (bucket.get(k) ?? 0) + l.text.length);
    }
  let best = 11;
  let max = -1;
  bucket.forEach((v, k) => { if (v > max) { max = v; best = k; } });
  return best;
}

/* ---------- tables (ruled borders) ---------- */

interface Grid { x0: number; y0: number; x1: number; y1: number; xs: number[]; ys: number[] }

function uniqSorted(vals: number[], tol: number): number[] {
  const s = [...vals].sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of s) {
    if (!out.length || v - out[out.length - 1] > tol) out.push(v);
  }
  return out;
}

function detectTables(canvas: HTMLCanvasElement, scale: number): Grid[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  const W = canvas.width;
  const H = canvas.height;
  const px = ctx.getImageData(0, 0, W, H).data;
  const dark = new Uint8Array(W * H);
  for (let i = 0, j = 0; j < W * H; i += 4, j++) {
    dark[j] = px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114 < 150000 ? 1 : 0;
  }

  const minLen = Math.round(scale * 18);
  const maxThick = Math.max(4, Math.round(scale * 3));
  type L = { a: number; b: number; p0: number; p1: number };

  const collect = (horizontal: boolean): L[] => {
    const lines: L[] = [];
    const outer = horizontal ? H : W;
    const inner = horizontal ? W : H;
    for (let o = 0; o < outer; o++) {
      let run = 0;
      for (let k = 0; k <= inner; k++) {
        const on = k < inner && dark[horizontal ? o * W + k : k * W + o] === 1;
        if (on) { run++; continue; }
        if (run >= minLen) {
          const a = k - run;
          const b = k - 1;
          let merged: L | undefined;
          for (let q = lines.length - 1; q >= 0 && q >= lines.length - 60; q--) {
            const l = lines[q];
            if (o - l.p1 <= 1 && Math.abs(l.a - a) <= 4 && Math.abs(l.b - b) <= 4) { merged = l; break; }
          }
          if (merged) merged.p1 = o;
          else lines.push({ a, b, p0: o, p1: o });
        }
        run = 0;
      }
    }
    return lines.filter((l) => l.p1 - l.p0 + 1 <= maxThick);
  };

  const hs = collect(true).map((l) => ({ a: l.a, b: l.b, p: (l.p0 + l.p1) / 2 }));
  const vs = collect(false).map((l) => ({ a: l.a, b: l.b, p: (l.p0 + l.p1) / 2 }));
  if (hs.length < 2 || vs.length < 2 || hs.length > 400 || vs.length > 400) return [];

  const n = hs.length;
  const parent = Array.from({ length: n + vs.length }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const tol = Math.round(scale * 2.5);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < vs.length; j++) {
      if (vs[j].p >= hs[i].a - tol && vs[j].p <= hs[i].b + tol && hs[i].p >= vs[j].a - tol && hs[i].p <= vs[j].b + tol) {
        parent[find(i)] = find(n + j);
      }
    }
  }

  const groups = new Map<number, { h: number[]; v: number[] }>();
  for (let i = 0; i < n + vs.length; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, { h: [], v: [] });
    const g = groups.get(r)!;
    if (i < n) g.h.push(hs[i].p);
    else g.v.push(vs[i - n].p);
  }

  const grids: Grid[] = [];
  groups.forEach((g) => {
    if (g.h.length < 2 || g.v.length < 2) return;
    const xs = uniqSorted(g.v, tol * 1.5);
    const ys = uniqSorted(g.h, tol * 1.5);
    if (xs.length < 2 || ys.length < 2) return;
    const cols = xs.length - 1;
    const rows = ys.length - 1;
    if (cols * rows < 2 || cols > 30 || rows > 200) return;
    const x0 = xs[0];
    const x1 = xs[xs.length - 1];
    const y0 = ys[0];
    const y1 = ys[ys.length - 1];
    if (x1 - x0 > W * 0.92 && y1 - y0 > H * 0.92) return;
    if (x1 - x0 < scale * 40 || y1 - y0 < scale * 14) return;
    grids.push({ x0, y0, x1, y1, xs, ys });
  });
  return grids;
}

/* ---------- images ---------- */

const mulM = (A: number[], B: number[]) => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];

interface Box { x: number; y: number; w: number; h: number }

function imageBoxes(opList: any, OPS: any, vt: number[], W: number, H: number): Box[] {
  const boxes: Box[] = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  const { fnArray, argsArray } = opList;
  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const a = argsArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) { const p = stack.pop(); if (p) ctm = p; }
    else if (fn === OPS.transform) ctm = mulM(ctm, a);
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm.slice());
      if (a && a[0]) ctm = mulM(ctm, a[0]);
    } else if (fn === OPS.paintFormXObjectEnd) { const p = stack.pop(); if (p) ctm = p; }
    else if (
      fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject ||
      fn === OPS.paintImageMaskXObject || fn === OPS.paintImageXObjectRepeat
    ) {
      const m = mulM(vt, ctm);
      const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]]);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(...xs) - x;
      const h = Math.max(...ys) - y;
      if (w < 16 || h < 16 || w > W * 1.05 || h > H * 1.05) continue;
      if ((w * h) / (W * H) > 0.85) continue;
      if (Math.max(w / h, h / w) > 25) continue;
      boxes.push({ x, y, w, h });
    }
  }
  const kept: Box[] = [];
  for (const b of boxes) {
    const dup = kept.some((k) => {
      const ix = Math.max(0, Math.min(k.x + k.w, b.x + b.w) - Math.max(k.x, b.x));
      const iy = Math.max(0, Math.min(k.y + k.h, b.y + b.h) - Math.max(k.y, b.y));
      return (ix * iy) / Math.min(k.w * k.h, b.w * b.h) > 0.8;
    });
    if (!dup) kept.push(b);
  }
  return kept.slice(0, 60);
}

async function cropToJpeg(src: HTMLCanvasElement, b: Box) {
  const x = clamp(Math.floor(b.x), 0, src.width - 1);
  const y = clamp(Math.floor(b.y), 0, src.height - 1);
  const w = Math.min(Math.ceil(b.w), src.width - x);
  const h = Math.min(Math.ceil(b.h), src.height - y);
  if (w < 12 || h < 12) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
  const data = await canvasToBytes(c, "image/jpeg", 0.88);
  c.width = 0;
  c.height = 0;
  return { data, w, h };
}

interface TableData { top: number; xsPt: number[]; cells: Ln[][][] }
interface ImgData { top: number; wPt: number; hPt: number; data: Uint8Array }
interface PageData { lines: Ln[]; w: number; h: number; tables: TableData[]; images: ImgData[] }

/* ---------- page ---------- */

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<boolean[]>([]);
  const [range, setRange] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [maybeScanned, setMaybeScanned] = useState(false);
  const [legacyWarn, setLegacyWarn] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("text");
  const [lang, setLang] = useState("eng");
  const [alsoEnglish, setAlsoEnglish] = useState(true);
  const [headings, setHeadings] = useState(true);
  const [keepBreaks, setKeepBreaks] = useState(false);
  const [pageBreaks, setPageBreaks] = useState(true);
  const [removeNums, setRemoveNums] = useState(false);
  const [detectTbl, setDetectTbl] = useState(true);
  const [keepImages, setKeepImages] = useState(true);
  const [font, setFont] = useState("Calibri");
  const [fontMode, setFontMode] = useState<FontMode>("smart");
  const [outName, setOutName] = useState("converted");

  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<{ size: number; pages: number } | null>(null);
  const cancelRef = useRef(false);
  const mounted = useRef(true);
  const loadToken = useRef(0);
  const previewUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    mounted.current = true;
    const urls = previewUrls.current;
    return () => {
      mounted.current = false;
      loadToken.current++;
      urls.forEach((u) => URL.revokeObjectURL(u));
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
    setMaybeScanned(false);
    setLegacyWarn(null);
    setResult(null);
    setResultInfo(null);
    let task: any = null;
    try {
      const opened = await openPdf(f);
      task = opened.task;
      const count: number = opened.doc.numPages;
      if (!count) throw new Error("PDF has no pages");
      let chars = 0;
      let sample = "";
      const fontsSeen = new Set<string>();
      const probe = Math.min(3, count);
      for (let i = 1; i <= probe; i++) {
        const page = await opened.doc.getPage(i);
        const tc = await page.getTextContent();
        chars += tc.items.reduce((s: number, it: any) => s + (it.str ? it.str.trim().length : 0), 0);
        sample += tc.items.map((it: any) => it.str || "").join(" ") + " ";
        const fm = await fontMap(page, tc.items);
        Object.values(fm).forEach((n) => { const p = parseFont(n).family; if (p) fontsSeen.add(p); });
      }
      if (!mounted.current || token !== loadToken.current) return;
      setFile(f);
      setPageCount(count);
      setSelected(Array(count).fill(true));
      setRange("");
      setOutName(safeBaseName(f.name));
      const scanned = chars < 20 * probe;
      setMaybeScanned(scanned);
      setMode(scanned ? "ocr" : "text");

      const legacyFont = Array.from(fontsSeen).find((n) => LEGACY_RE.test(n));
      const suspicious = (sample.match(/[a-z];[a-z]/g) || []).length >= 3;
      if (!scanned && (legacyFont || suspicious)) {
        setLegacyWarn(
          `Legacy-encoded text may be present${legacyFont ? ` (font: ${legacyFont})` : ""}. Such PDFs may not convert to readable Unicode text. Try OCR using the document language, or use Page images to retain the appearance.`
        );
      }

      renderPdfThumbnails(
        f,
        (idx, url) => {
          if (!mounted.current || token !== loadToken.current) { URL.revokeObjectURL(url); return; }
          previewUrls.current.add(url);
          setThumbs((prev) => ({ ...prev, [idx]: url }));
        },
        () => !mounted.current || token !== loadToken.current,
        120
      ).catch(() => { /* previews are optional */ });
    } catch (e) {
      console.error("PDF load failed:", e);
      if (mounted.current && token === loadToken.current) {
        setFile(null);
        setLoadError("This PDF could not be opened. It may be damaged or password-protected. This tool cannot decrypt protected PDFs.");
      }
    } finally {
      if (task) { try { await task.destroy(); } catch { /* ignore */ } }
    }
  };

  const rangeInvalid = range.trim() !== "" && parsePageRange(range, pageCount) === null;

  const onRangeChange = (value: string) => {
    setRange(value);
    if (!value.trim()) return;
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
    setRange(selectedToRange(sel));
  };

  const setAll = (v: boolean) => {
    setSelected(Array(pageCount).fill(v));
    setRange("");
  };

  const selectedIdx = useMemo(
    () => selected.map((s, i) => (s ? i : -1)).filter((i) => i >= 0),
    [selected]
  );

  const handleConvert = async () => {
    if (!file || selectedIdx.length === 0 || rangeInvalid || status === "processing") return;
    cancelRef.current = false;
    setResult(null);
    setResultInfo(null);
    setModalError(null);
    setProgress(0);
    setMessage("Opening the PDF...");
    setStatus("processing");
    await tick();

    let task: any = null;
    let worker: any = null;
    try {
      const D: any = await import("docx");
      const opened = await openPdf(file);
      task = opened.task;
      const doc = opened.doc;
      const OPS = opened.pdfjs.OPS;
      const total = selectedIdx.length;

      const first = await doc.getPage(selectedIdx[0] + 1);
      const fv = first.getViewport({ scale: 1 });
      const marginTw = mode === "image" ? 720 : 1080;
      const marginObj = { top: marginTw, right: marginTw, bottom: marginTw, left: marginTw };
      const sectionProps = {
        page: {
          size: { width: Math.round(fv.width * 20), height: Math.round(fv.height * 20) },
          margin: marginObj,
        },
      };

      const children: any[] = [];
      let finalSections: any[] | null = null;

      const mkRun = (r: Run, forceBold: boolean) => {
        const f = pickFont(r, font, fontMode);
        const bold = forceBold || r.bold;
        return new D.TextRun({
          text: r.text,
          size: clamp(Math.round(r.size * 2), 16, 120),
          sizeComplexScript: true,
          font: { ascii: f, hAnsi: f, cs: f, eastAsia: f },
          color: "000000",
          bold,
          boldComplexScript: bold,
          italics: r.italic,
          italicsComplexScript: r.italic,
          rightToLeft: RTL_RE.test(r.text),
        });
      };

      const makePara = (b: Block, inCell: boolean) => {
        const runs = b.runs.filter((r) => r.text !== "").map((r) => mkRun(r, b.kind === "h"));
        if (runs.length === 0) return null;
        const common: any = { children: runs, bidirectional: b.rtl };
        if (b.center) common.alignment = D.AlignmentType.CENTER;
        if (b.kind === "h") {
          const lv = b.level === 1 ? D.HeadingLevel.HEADING_1 : b.level === 2 ? D.HeadingLevel.HEADING_2 : D.HeadingLevel.HEADING_3;
          return new D.Paragraph({ ...common, heading: lv, spacing: { before: inCell ? 40 : 240, after: inCell ? 40 : 120 } });
        }
        if (b.kind === "li") return new D.Paragraph({ ...common, bullet: { level: 0 }, spacing: { after: 40 } });
        return new D.Paragraph({ ...common, spacing: { after: inCell ? 40 : 120, line: 276 } });
      };

      const border = { style: D.BorderStyle.SINGLE, size: 4, color: "000000" };

      const buildTable = (t: TableData, pageW: number, pageH: number) => {
        const contentTw = Math.round(pageW * 20) - 2 * marginTw;
        const colPt = t.xsPt.slice(1).map((x, i) => x - t.xsPt[i]);
        const totalPt = colPt.reduce((s, v) => s + v, 0) || 1;
        const f = Math.min(1, contentTw / 20 / totalPt);
        const colTw = colPt.map((w) => Math.max(240, Math.round(w * f * 20)));
        const rows = t.cells.map((rowCells) =>
          new D.TableRow({
            children: rowCells.map((lines, ci) => {
              const blocks = linesToBlocks(lines, pageW, pageH, 1, { headings: false, keepBreaks, removeNums: false });
              const paras = blocks.map((b) => makePara(b, true)).filter(Boolean);
              return new D.TableCell({
                width: { size: colTw[ci], type: D.WidthType.DXA },
                margins: { top: 40, bottom: 40, left: 80, right: 80 },
                children: paras.length ? paras : [new D.Paragraph("")],
              });
            }),
          })
        );
        return new D.Table({
          width: { size: colTw.reduce((s, v) => s + v, 0), type: D.WidthType.DXA },
          columnWidths: colTw,
          layout: D.TableLayoutType.FIXED,
          borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
          rows,
        });
      };

      if (mode === "text") {
        const pages: PageData[] = [];
        for (let k = 0; k < total; k++) {
          if (cancelRef.current) return;
          setMessage(`Reading page ${selectedIdx[k] + 1} (${k + 1} of ${total})`);
          const page = await doc.getPage(selectedIdx[k] + 1);
          const vp1 = page.getViewport({ scale: 1 });
          const tc = await page.getTextContent();
          let opList: any = null;
          try { opList = await page.getOperatorList(); } catch { /* optional */ }
          const fm = await fontMap(page, tc.items, opList);

          let grids: Grid[] = [];
          let imgBoxes: Box[] = [];
          let canvas: HTMLCanvasElement | null = null;
          const vpR = page.getViewport({ scale: RS });

          if (detectTbl || keepImages) {
            try {
              canvas = await renderToCanvas(page, RS);
              if (detectTbl) grids = detectTables(canvas, RS);
              if (keepImages && opList) imgBoxes = imageBoxes(opList, OPS, vpR.transform, canvas.width, canvas.height);
            } catch { /* fall back to plain text */ }
          }

          const tableObjs = grids.map((g) => ({
            g,
            cellItems: Array.from({ length: g.ys.length - 1 }, () =>
              Array.from({ length: g.xs.length - 1 }, () => [] as any[])),
          }));
          const mainItems: any[] = [];
          for (const it of tc.items) {
            if (typeof it.str !== "string" || it.str === "") continue;
            const size = Math.hypot(it.transform[2], it.transform[3]) || 10;
            const [cx, cy] = vpR.convertToViewportPoint(it.transform[4] + (it.width || 0) / 2, it.transform[5] + size * 0.3);
            let placed = false;
            for (const t of tableObjs) {
              const g = t.g;
              if (cx >= g.x0 && cx <= g.x1 && cy >= g.y0 && cy <= g.y1) {
                let c = 0;
                while (c < g.xs.length - 2 && cx >= g.xs[c + 1]) c++;
                let r = 0;
                while (r < g.ys.length - 2 && cy >= g.ys[r + 1]) r++;
                t.cellItems[r][c].push(it);
                placed = true;
                break;
              }
            }
            if (!placed) mainItems.push(it);
          }

          const tables: TableData[] = [];
          for (const t of tableObjs) {
            const cells = t.cellItems.map((row) => row.map((items) => extractLines(items, fm, vp1.width)));
            if (!cells.some((row) => row.some((c) => c.length > 0))) continue;
            tables.push({ top: t.g.y0 / RS, xsPt: t.g.xs.map((x) => x / RS), cells });
          }

          const images: ImgData[] = [];
          if (canvas && imgBoxes.length) {
            for (const b of imgBoxes) {
              const cx = b.x + b.w / 2;
              const cy = b.y + b.h / 2;
              if (grids.some((g) => cx >= g.x0 && cx <= g.x1 && cy >= g.y0 && cy <= g.y1)) continue;
              const crop = await cropToJpeg(canvas, b);
              if (crop) images.push({ top: b.y / RS, wPt: b.w / RS, hPt: b.h / RS, data: crop.data });
            }
          }
          if (canvas) { canvas.width = 0; canvas.height = 0; }

          pages.push({ lines: extractLines(mainItems, fm, vp1.width), w: vp1.width, h: vp1.height, tables, images });
          setProgress(((k + 1) / total) * 70);
          await tick();
        }

        const body = bodySizeOf(pages.map((p) => p.lines));
        const hasContent = pages.some((p) => p.lines.length || p.tables.length || p.images.length);
        if (!hasContent) {
          setModalError("No selectable text or supported images were found. Try Scanned PDF (OCR) for a scan, or Page images to preserve the appearance.");
          setStatus("error");
          return;
        }

        const flat: any[] = [];
        const sections: any[] = [];

        pages.forEach((p) => {
          const blocks = linesToBlocks(p.lines, p.w, p.h, body, { headings, keepBreaks, removeNums });
          type El = { top: number; make: () => any };
          const els: El[] = [];
          blocks.forEach((b) => els.push({ top: b.top, make: () => makePara(b, false) }));
          p.tables.forEach((t) => els.push({ top: t.top, make: () => buildTable(t, p.w, p.h) }));
          p.images.forEach((im) => els.push({
            top: im.top,
            make: () => {
              const contentPx = ((p.w * 20 - 2 * marginTw) / 20) * (96 / 72);
              let w = im.wPt * (96 / 72);
              let h = im.hPt * (96 / 72);
              if (w > contentPx) { h = (h * contentPx) / w; w = contentPx; }
              return new D.Paragraph({
                spacing: { after: 120 },
                children: [new D.ImageRun({ type: "jpg", data: im.data, transformation: { width: Math.round(w), height: Math.round(h) } })],
              });
            },
          }));
          els.sort((a, b) => a.top - b.top);
          const kids = els.map((e) => e.make()).filter(Boolean);

          if (pageBreaks) {
            sections.push({
              properties: {
                type: D.SectionType.NEXT_PAGE,
                page: {
                  size: { width: Math.round(p.w * 20), height: Math.round(p.h * 20) },
                  margin: marginObj,
                },
              },
              children: kids.length ? kids : [new D.Paragraph("")],
            });
          } else {
            flat.push(...kids);
          }
        });

        finalSections = pageBreaks
          ? sections
          : [{ properties: sectionProps, children: flat.length ? flat : [new D.Paragraph("")] }];
        setProgress(90);
      } else if (mode === "ocr") {
        setMessage("Starting OCR (the first run may download language data)...");
        await tick();
        const { createWorker } = await import("tesseract.js");
        const langStr = alsoEnglish && lang !== "eng" ? `${lang}+eng` : lang;
        const rtl = RTL_LANGS.has(lang);
        let cur = 0;
        worker = await createWorker(langStr, 1, {
          logger: (m: any) => {
            if (m.status === "recognizing text" && !cancelRef.current) {
              setProgress(((cur + (m.progress || 0)) / total) * 85 + 5);
            }
          },
        });
        for (let k = 0; k < total; k++) {
          if (cancelRef.current) return;
          cur = k;
          setMessage(`Recognizing page ${selectedIdx[k] + 1} (${k + 1} of ${total})`);
          const page = await doc.getPage(selectedIdx[k] + 1);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(3, Math.sqrt(20_000_000 / (base.width * base.height)));
          const canvas = await renderToCanvas(page, Math.max(1, scale));
          const { data } = await worker.recognize(canvas);
          canvas.width = 0;
          canvas.height = 0;
          const paras: string[] = String(data.text || "")
            .split(/\n\s*\n/)
            .map((s: string) => {
              let t = s.replace(/\s*\n\s*/g, " ").trim();
              if (CJK_LANGS.has(lang) || lang === "kor") {
                t = t.replace(/([\u3040-\u9FFF\uAC00-\uD7AF])\s+(?=[\u3040-\u9FFF\uAC00-\uD7AF])/g, "$1");
              }
              return norm(t);
            })
            .filter(Boolean);
          paras.forEach((t, i) => {
            const f = scriptFont(t) || font;
            children.push(new D.Paragraph({
              bidirectional: rtl,
              pageBreakBefore: pageBreaks && k > 0 && i === 0,
              spacing: { after: 120, line: 276 },
              children: [new D.TextRun({
                text: t, size: 24, sizeComplexScript: true,
                font: { ascii: f, hAnsi: f, cs: f, eastAsia: f },
                rightToLeft: rtl,
              })],
            }));
          });
          await tick();
        }
        if (children.length === 0) {
          setModalError("No text was recognized. Check the language setting and scan quality, or try Page images.");
          setStatus("error");
          return;
        }
      } else {
        const marginPt = 36;
        const cw = ((fv.width - marginPt * 2) * 96) / 72;
        const ch = ((fv.height - marginPt * 2) * 96) / 72 - 8;
        for (let k = 0; k < total; k++) {
          if (cancelRef.current) return;
          setMessage(`Rendering page ${selectedIdx[k] + 1} (${k + 1} of ${total})`);
          const page = await doc.getPage(selectedIdx[k] + 1);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.max(1, Math.min(2, Math.sqrt(14_000_000 / (base.width * base.height))));
          const canvas = await renderToCanvas(page, scale);
          const data = await canvasToBytes(canvas, "image/jpeg", 0.88);
          canvas.width = 0;
          canvas.height = 0;
          const aspect = base.width / base.height;
          let w = cw;
          let h = w / aspect;
          if (h > ch) { h = ch; w = h * aspect; }
          children.push(new D.Paragraph({
            pageBreakBefore: k > 0,
            children: [new D.ImageRun({
              type: "jpg", data,
              transformation: { width: Math.round(w), height: Math.round(h) },
            })],
          }));
          setProgress(((k + 1) / total) * 90);
          await tick();
        }
      }

      if (cancelRef.current) return;
      setMessage("Creating the Word file...");
      setProgress(95);
      await tick();
      const docx = new D.Document({
        creator: "PDF conversion tool",
        sections: finalSections ?? [{ properties: sectionProps, children }],
      });
      const blob = await D.Packer.toBlob(docx);
      if (cancelRef.current) return;
      setResult(blob);
      setResultInfo({ size: blob.size, pages: selectedIdx.length });
      setProgress(100);
      await new Promise((r) => setTimeout(r, 350));
      if (mounted.current && !cancelRef.current) setStatus("done");
    } catch (e) {
      console.error("PDF to Word conversion failed:", e);
      setModalError("Conversion failed. The PDF may be damaged or password-protected, too large for available browser memory, or contain unsupported features. Try fewer pages or another mode.");
      setStatus("error");
    } finally {
      if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
      if (task) { try { await task.destroy(); } catch { /* ignore */ } }
    }
  };

  const handleCancel = () => { cancelRef.current = true; setStatus("idle"); setProgress(0); };
  const closeModal = () => { setStatus("idle"); setModalError(null); };

  const resetAll = () => {
    cancelRef.current = true;
    loadToken.current++;
    previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrls.current.clear();
    setFile(null);
    setThumbs({});
    setSelected([]);
    setPageCount(0);
    setRange("");
    setResult(null);
    setResultInfo(null);
    setStatus("idle");
    setProgress(0);
    setMessage("");
    setModalError(null);
    setLoadError(null);
    setMaybeScanned(false);
    setLegacyWarn(null);
    setOutName("converted");
  };

  const safeName = safeBaseName(outName);
  const selectCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-600";
  const labelCls = "block text-xs font-semibold text-gray-700 mb-1";
  const checkCls = "flex items-center gap-2 text-sm text-gray-800";
  const canRun = !!file && selectedIdx.length > 0 && !rangeInvalid && status !== "processing";

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-50 text-sky-700 rounded-2xl mb-4">
            <FileOutput className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Convert PDF to Word (DOCX)</h1>
          <p className="text-gray-700 mt-3 max-w-3xl mx-auto leading-relaxed">
            Choose editable text extraction for PDFs with selectable text, OCR for scanned pages, or page images when
            preserving appearance matters most. Text conversion reconstructs the document and may not reproduce every
            layout detail.
          </p>
        </header>

        {!file ? (
          <div>
            <FileDropzone onFiles={loadFile} multiple={false} label="Choose one PDF file" />
            <p className="mt-3 text-center text-sm text-gray-600">Select a PDF from your device, then choose the pages to convert.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-sky-50 rounded-xl border border-sky-100">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-sky-700 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-sky-900">{pageCount} {pageCount === 1 ? "page" : "pages"} · {formatBytes(file.size)}</p>
                </div>
              </div>
              <button type="button" onClick={resetAll} className="text-sm text-red-700 hover:underline font-medium shrink-0">
                Choose another PDF
              </button>
            </div>

            {maybeScanned && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl text-sm">
                <Info className="w-5 h-5 shrink-0" />
                <span>This PDF has little selectable text. OCR mode was selected as a starting point; confirm the language and review the result.</span>
              </div>
            )}

            {legacyWarn && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{legacyWarn}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setMode("ocr"); setLang("tam"); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-700 text-white hover:bg-amber-800">Try Tamil OCR</button>
                  <button type="button" onClick={() => setMode("ocr")} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 hover:bg-amber-100">Choose OCR language</button>
                  <button type="button" onClick={() => setMode("image")} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 hover:bg-amber-100">Use page images</button>
                </div>
              </div>
            )}

            <section aria-labelledby="mode-heading">
              <h2 id="mode-heading" className="text-lg font-bold text-gray-900 mb-3">Choose a conversion method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODES.map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    aria-pressed={mode === m.key}
                    className={`text-left p-4 rounded-xl border-2 transition ${mode === m.key ? "border-sky-700 bg-sky-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <span className="block text-sm font-bold text-gray-900">{m.title}</span>
                    <span className="block text-xs text-gray-700 mt-1 leading-relaxed">{m.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="options-heading" className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <h2 id="options-heading" className="text-sm font-bold text-gray-900 mb-3">Conversion settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mode === "ocr" && (
                  <div>
                    <label className={labelCls} htmlFor="ocr-language">Language in the PDF</label>
                    <select id="ocr-language" value={lang} onChange={(e) => setLang(e.target.value)} className={selectCls}>
                      {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                )}
                {mode === "text" && (
                  <div>
                    <label className={labelCls} htmlFor="font-mode">Font matching</label>
                    <select id="font-mode" value={fontMode} onChange={(e) => setFontMode(e.target.value as FontMode)} className={selectCls}>
                      <option value="smart">Smart script-aware font</option>
                      <option value="original">Try the PDF font names</option>
                    </select>
                  </div>
                )}
                {mode !== "image" && (
                  <div>
                    <label className={labelCls} htmlFor="base-font">Default font for Latin text</label>
                    <select id="base-font" value={font} onChange={(e) => setFont(e.target.value)} className={selectCls}>
                      {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mode === "ocr" && lang !== "eng" && (
                  <label className={checkCls}>
                    <input type="checkbox" checked={alsoEnglish} onChange={(e) => setAlsoEnglish(e.target.checked)} className="accent-sky-700" />
                    Also recognize English
                  </label>
                )}
                {mode === "text" && (
                  <>
                    <label className={checkCls}>
                      <input type="checkbox" checked={detectTbl} onChange={(e) => setDetectTbl(e.target.checked)} className="accent-sky-700" />
                      Detect bordered tables (best effort)
                    </label>
                    <label className={checkCls}>
                      <input type="checkbox" checked={keepImages} onChange={(e) => setKeepImages(e.target.checked)} className="accent-sky-700" />
                      Try to include embedded images
                    </label>
                    <label className={checkCls}>
                      <input type="checkbox" checked={headings} onChange={(e) => setHeadings(e.target.checked)} className="accent-sky-700" />
                      Infer headings from larger text
                    </label>
                    <label className={checkCls}>
                      <input type="checkbox" checked={keepBreaks} onChange={(e) => setKeepBreaks(e.target.checked)} className="accent-sky-700" />
                      Keep more original line breaks
                    </label>
                    <label className={checkCls}>
                      <input type="checkbox" checked={removeNums} onChange={(e) => setRemoveNums(e.target.checked)} className="accent-sky-700" />
                      Try to omit standalone page numbers
                    </label>
                  </>
                )}
                {mode !== "image" && (
                  <label className={checkCls}>
                    <input type="checkbox" checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} className="accent-sky-700" />
                    Start each source page on a new Word page
                  </label>
                )}
              </div>

              {mode === "text" && (
                <p className="mt-3 text-xs text-gray-700 leading-relaxed">
                  Text extraction reconstructs approximate reading order and formatting. Complex columns, borderless tables, merged cells, charts, vector art, exact colors, footnotes, and some font encodings may not be preserved. Compare the DOCX with the source PDF.
                </p>
              )}
              {mode === "ocr" && (
                <p className="mt-3 text-xs text-gray-700 leading-relaxed">
                  OCR runs in your browser and may download language data on first use. Accuracy depends on scan quality and language. Proofread names and numbers; OCR output is not a verified transcription.
                </p>
              )}
              {mode === "image" && (
                <p className="mt-3 text-xs text-gray-700 leading-relaxed">
                  This mode places a rendered image of each selected PDF page in Word. It preserves appearance rather than creating editable or searchable text, and may create a large DOCX.
                </p>
              )}
            </section>

            <section aria-labelledby="pages-heading" className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 id="pages-heading" className="text-sm font-bold text-gray-900">
                  Pages ({selectedIdx.length} of {pageCount} selected)
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="page-range" className="sr-only">Pages to convert</label>
                  <input
                    id="page-range"
                    value={range}
                    onChange={(e) => onRangeChange(e.target.value)}
                    placeholder="All pages (e.g. 1-3, 5)"
                    aria-invalid={rangeInvalid}
                    className={`w-full sm:w-56 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 ${rangeInvalid ? "border-red-600" : "border-gray-300"}`}
                  />
                  <button type="button" onClick={() => setAll(true)} className="px-3 py-2 text-xs border rounded-lg bg-white hover:bg-gray-100">Select all</button>
                  <button type="button" onClick={() => setAll(false)} className="px-3 py-2 text-xs border rounded-lg bg-white hover:bg-gray-100">Select none</button>
                </div>
              </div>
              {rangeInvalid && <p className="mb-3 text-sm text-red-800" role="alert">Enter valid pages from 1 to {pageCount}, such as 1-3, 5.</p>}
              <p className="mb-3 text-xs text-gray-700">Selected pages are converted in their original order. Thumbnails are previews only.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
                {selected.map((on, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => togglePage(i)}
                    aria-pressed={on}
                    aria-label={`${on ? "Deselect" : "Select"} page ${i + 1}`}
                    className={`relative rounded-lg border-2 overflow-hidden bg-white aspect-[3/4] flex items-center justify-center ${on ? "border-sky-600" : "border-gray-200 opacity-60"}`}
                  >
                    {thumbs[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbs[i]} alt={`Preview of page ${i + 1}`} className="w-full h-full object-contain" draggable={false} />
                    ) : (
                      <span className="px-2 text-center text-xs text-gray-600">Preview unavailable</span>
                    )}
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/75 text-white px-1.5 rounded">Page {i + 1}</span>
                    {on && (
                      <span className="absolute top-1 right-1 bg-sky-700 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <label htmlFor="output-name" className="sr-only">Output Word file name</label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden sm:w-72">
                <input
                  id="output-name"
                  value={outName}
                  onChange={(e) => setOutName(e.target.value)}
                  className="flex-1 px-3 py-3 text-sm focus:outline-none min-w-0"
                  placeholder="File name"
                />
                <span className="px-3 text-sm text-gray-700 bg-gray-50 py-3">.docx</span>
              </div>
              <div className="flex-1">
                <ProcessButton
                  onClick={handleConvert}
                  loading={status === "processing"}
                  disabled={!canRun}
                  label="Convert selected pages to Word"
                  loadingLabel="Converting pages..."
                />
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="mt-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-sm" role="alert">
            <AlertCircle className="w-5 h-5 shrink-0" /> <span>{loadError}</span>
          </div>
        )}

        {resultInfo && status === "done" && (
          <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4" aria-live="polite">
            <h2 className="font-semibold text-green-950">Word file is ready</h2>
            <p className="mt-1 text-sm text-green-900">
              Converted {resultInfo.pages} selected {resultInfo.pages === 1 ? "page" : "pages"}. File size: {formatBytes(resultInfo.size)}.
            </p>
            <p className="mt-1 text-xs text-green-900">Open the DOCX and compare layout, tables, and recognized text with the source PDF.</p>
          </section>
        )}

        <aside className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-green-950">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              <strong>Privacy and limitations:</strong> this tool processes the PDF in your browser and does not upload it to our server. OCR may retrieve language data. Password-protected or damaged PDFs may fail. Keep the original and check the converted file before relying on it.
            </p>
          </div>
        </aside>
      </div>

      <ProcessingModal
        status={status}
        progress={progress}
        title="Converting PDF pages to Word"
        message={message}
        blob={result}
        filename={`${safeName}.docx`}
        errorMessage={modalError}
        onCancel={handleCancel}
        onClose={closeModal}
        onReset={resetAll}
      />

      <ToolSeoContent
        id="pdf-to-word"
        steps={[
          "Choose one PDF from your device. The page count and file size appear after it opens.",
          "Choose Editable text for selectable text, Scanned PDF (OCR) for scanned pages, or Page images when appearance matters more than editability.",
          "Select pages with thumbnails or enter a range such as 1-3, 5.",
          "Review the conversion settings and limitations. OCR and reconstructed layout can contain errors.",
          "Choose an output name, convert, then compare the downloaded DOCX with the PDF before using it.",
        ]}
      />
    </main>
  );
}
