'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as RPE } from 'react';
import {
    MousePointer2, FileText, Type, Eraser, Highlighter, Square, Circle, Minus, Pencil, ImagePlus,
    Undo2, Redo2, ZoomIn, ZoomOut, Trash2, ChevronLeft, ChevronRight, Bold, Italic, AlertCircle,
} from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import ToolSeoContent from '@/components/ToolSeoContent';
import { formatBytes, renderPdfThumbnails } from '@/lib/pdf-utils';
import {
    Ann, ImageAnn, Seg, ShapeAnn, Snap, Style, TextAnn, Tool, DrawAnn,
    CSS_FONT, DEFAULT_STYLE, RTL_RE, applyPatch, bboxOf, buildSegs, clamp, drawAnn, exportPdf,
    hits, measureTextAnn, sampleColors, translateAnn, uid,
} from '@/lib/edit-pdf-core';

const TOOLS: { key: Tool; label: string; icon: any }[] = [
    { key: 'select', label: 'Select', icon: MousePointer2 },
    { key: 'edit', label: 'Edit text', icon: FileText },
    { key: 'text', label: 'Add text', icon: Type },
    { key: 'whiteout', label: 'Whiteout', icon: Eraser },
    { key: 'highlight', label: 'Highlight', icon: Highlighter },
    { key: 'rect', label: 'Rectangle', icon: Square },
    { key: 'ellipse', label: 'Ellipse', icon: Circle },
    { key: 'line', label: 'Line', icon: Minus },
    { key: 'draw', label: 'Draw', icon: Pencil },
];

const tick = () => new Promise<void>((r) => setTimeout(r, 20));

async function openPdf(file: File) {
    const pdfjs: any = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
    const data = new Uint8Array(await file.arrayBuffer());
    const task: any = pdfjs.getDocument({ data });
    const doc: any = await task.promise;
    return { doc, task };
}

type Drag =
    | { mode: 'move'; id: string; sx: number; sy: number; orig: Ann; snap: Snap; moved: boolean }
    | { mode: 'resize'; id: string; sx: number; sy: number; orig: ShapeAnn | ImageAnn; snap: Snap; moved: boolean }
    | { mode: 'create'; sx: number; sy: number; id: string }
    | { mode: 'draw'; id: string };

export default function EditPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageIdx, setPageIdx] = useState(0);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [pageSize, setPageSize] = useState<{ w: number; h: number; rot: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [tool, setTool] = useState<Tool>('select');
    const [anns, setAnns] = useState<Snap>({});
    const [draft, setDraft] = useState<Ann | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [segs, setSegs] = useState<Seg[]>([]);
    const [style, setStyle] = useState<Style>(DEFAULT_STYLE);
    const [flatten, setFlatten] = useState(false);
    const [outName, setOutName] = useState('edited');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [histVer, setHistVer] = useState(0);
    const [imgVer, setImgVer] = useState(0);

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const docRef = useRef<any>(null);
    const taskRef = useRef<any>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
    const annCanvasRef = useRef<HTMLCanvasElement>(null);
    const layerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const editStart = useRef(0);
    const pendingText = useRef<{ x: number; y: number } | null>(null);
    const annsRef = useRef<Snap>({});
    const draftRef = useRef<Ann | null>(null);
    const past = useRef<Snap[]>([]);
    const future = useRef<Snap[]>([]);
    const imgs = useRef<Map<string, HTMLImageElement>>(new Map());
    const dragRef = useRef<Drag | null>(null);
    const lastKey = useRef({ key: '', t: 0 });
    const justCreated = useRef<string | null>(null);
    const cancelRef = useRef(false);
    const mounted = useRef(true);
    const loadToken = useRef(0);

    const k = zoom * (96 / 72);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            loadToken.current++;
            if (taskRef.current) { try { taskRef.current.destroy(); } catch { /* ignore */ } }
        };
    }, []);

    /* ---------- history ---------- */
    const pushHistory = (snap: Snap) => {
        past.current.push(snap);
        if (past.current.length > 150) past.current.shift();
        future.current = [];
        setHistVer((v) => v + 1);
    };
    const live = (fn: (l: Ann[]) => Ann[], pg = pageIdx) => {
        const cur = annsRef.current;
        const next = { ...cur, [pg]: fn(cur[pg] || []) };
        annsRef.current = next;
        setAnns(next);
    };
    const update = (fn: (l: Ann[]) => Ann[], pg = pageIdx, key?: string) => {
        const now = Date.now();
        if (key && lastKey.current.key === key && now - lastKey.current.t < 800) {
            lastKey.current.t = now;
        } else {
            pushHistory(annsRef.current);
            lastKey.current = { key: key || '', t: now };
        }
        live(fn, pg);
    };
    const undo = () => {
        const p = past.current.pop();
        if (!p) return;
        future.current.push(annsRef.current);
        annsRef.current = p;
        setAnns(p);
        setSelected(null);
        setEditing(null);
        setHistVer((v) => v + 1);
    };
    const redo = () => {
        const n = future.current.pop();
        if (!n) return;
        past.current.push(annsRef.current);
        annsRef.current = n;
        setAnns(n);
        setSelected(null);
        setEditing(null);
        setHistVer((v) => v + 1);
    };

    const startEdit = (id: string) => {
        editStart.current = Date.now();
        setSelected(id);
        setEditing(id);
    };

    useEffect(() => {
        if (!editing) return;
        const t = setTimeout(() => {
            const el = textRef.current;
            if (el) {
                el.focus();
                const n = el.value.length;
                el.setSelectionRange(n, n);
            }
        }, 40);
        return () => clearTimeout(t);
    }, [editing]);

    /* ---------- load ---------- */
    const loadFile = async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        const token = ++loadToken.current;
        setLoadError(null);
        try {
            const opened = await openPdf(f);
            if (token !== loadToken.current) { try { await opened.task.destroy(); } catch { /* ignore */ } return; }
            if (taskRef.current) { try { await taskRef.current.destroy(); } catch { /* ignore */ } }
            docRef.current = opened.doc;
            taskRef.current = opened.task;
            annsRef.current = {};
            past.current = [];
            future.current = [];
            imgs.current = new Map();
            setAnns({});
            setThumbs({});
            setSelected(null);
            setEditing(null);
            setPageIdx(0);
            setPageCount(opened.doc.numPages);
            setOutName(f.name.replace(/\.pdf$/i, '') + '-edited');
            setFile(f);
            const p1 = await opened.doc.getPage(1);
            const v = p1.getViewport({ scale: 1 });
            const avail = (scrollRef.current?.clientWidth || 900) - 48;
            setZoom(clamp(avail / (v.width * (96 / 72)), 0.4, 2));
            renderPdfThumbnails(
                f,
                (idx, url) => {
                    if (!mounted.current || token !== loadToken.current) return;
                    setThumbs((prev) => ({ ...prev, [idx]: url }));
                },
                () => !mounted.current || token !== loadToken.current,
                110
            ).catch(() => { /* optional */ });
        } catch {
            setLoadError('This PDF could not be opened. It may be corrupted or password protected.');
        }
    };

    const fitZoom = () => {
        if (!pageSize) return;
        const avail = (scrollRef.current?.clientWidth || 900) - 48;
        setZoom(clamp(avail / (pageSize.w * (96 / 72)), 0.3, 3));
    };

    /* ---------- render page ---------- */
    useEffect(() => {
        const doc = docRef.current;
        if (!doc || !file) return;
        let cancelled = false;
        let task: any = null;
        (async () => {
            try {
                const page = await doc.getPage(pageIdx + 1);
                const vp1 = page.getViewport({ scale: 1 });
                if (cancelled) return;
                setPageSize({ w: vp1.width, h: vp1.height, rot: page.rotate || 0 });
                const dpr = Math.min(2, window.devicePixelRatio || 1);
                const vp = page.getViewport({ scale: k * dpr });
                const canvas = pdfCanvasRef.current;
                if (!canvas) return;
                canvas.width = Math.floor(vp.width);
                canvas.height = Math.floor(vp.height);
                canvas.style.width = `${vp1.width * k}px`;
                canvas.style.height = `${vp1.height * k}px`;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                task = page.render({ canvasContext: ctx, viewport: vp, canvas } as any);
                await task.promise;
            } catch { /* cancelled render */ }
        })();
        return () => {
            cancelled = true;
            if (task) { try { task.cancel(); } catch { /* ignore */ } }
        };
    }, [file, pageIdx, k]);

    useEffect(() => {
        const doc = docRef.current;
        if (!doc || !file) return;
        let cancelled = false;
        (async () => {
            try {
                const page = await doc.getPage(pageIdx + 1);
                if ((page.rotate || 0) !== 0) { if (!cancelled) setSegs([]); return; }
                const vp = page.getViewport({ scale: 1 });
                const tc = await page.getTextContent();
                if (!cancelled) setSegs(buildSegs(tc.items, tc.styles, vp));
            } catch { if (!cancelled) setSegs([]); }
        })();
        return () => { cancelled = true; };
    }, [file, pageIdx]);

    useEffect(() => {
        Object.values(anns).flat().forEach((a) => {
            if (a.type === 'image' && !imgs.current.has(a.id)) {
                const im = new Image();
                im.onload = () => setImgVer((v) => v + 1);
                im.src = a.src;
                imgs.current.set(a.id, im);
            }
        });
    }, [anns]);

    useEffect(() => {
        const c = annCanvasRef.current;
        if (!c || !pageSize) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = Math.floor(pageSize.w * k * dpr);
        c.height = Math.floor(pageSize.h * k * dpr);
        c.style.width = `${pageSize.w * k}px`;
        c.style.height = `${pageSize.h * k}px`;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, c.width, c.height);
        const list = [...(anns[pageIdx] || []), ...(draft ? [draft] : [])];
        list.forEach((a) => { if (a.type !== 'text') drawAnn(ctx, a, k * dpr, imgs.current); });
    }, [anns, draft, pageIdx, pageSize, k, imgVer]);

    const pageAnns = anns[pageIdx] || [];
    const selAnn = useMemo(() => pageAnns.find((a) => a.id === selected) || null, [pageAnns, selected]);

    const gotoPage = (i: number) => {
        setSelected(null);
        setEditing(null);
        setDraft(null);
        setPageIdx(clamp(i, 0, pageCount - 1));
    };

    const selectTool = (t: Tool) => {
        setTool(t);
        setEditing(null);
        pendingText.current = null;
        if (t !== 'select') setSelected(null);
    };

    const deleteSelected = () => {
        if (!selected) return;
        update((l) => l.filter((a) => a.id !== selected));
        setSelected(null);
        setEditing(null);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tgt = e.target as HTMLElement;
            const typing = !!tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT');
            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key.toLowerCase() === 'z' && !typing) {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            } else if (mod && e.key.toLowerCase() === 'y' && !typing) {
                e.preventDefault();
                redo();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !typing) {
                e.preventDefault();
                deleteSelected();
            } else if (e.key === 'Escape' && !typing) {
                setEditing(null);
                setSelected(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, pageIdx]);

    /* ---------- style ---------- */
    const applyStyle = (patch: Partial<Style>) => {
        setStyle((s) => ({ ...s, ...patch }));
        if (selected) {
            update((l) => l.map((a) => (a.id === selected ? applyPatch(a, patch) : a)), pageIdx, `style:${selected}:${Object.keys(patch)[0]}`);
        }
    };

    const group = useMemo(() => {
        if (selAnn) {
            if (selAnn.type === 'text') return 'text';
            if (selAnn.type === 'shape') return selAnn.kind === 'highlight' ? 'hl' : selAnn.kind === 'whiteout' ? 'wo' : 'shape';
            if (selAnn.type === 'image') return 'image';
            return 'line';
        }
        if (tool === 'text' || tool === 'edit') return 'text';
        if (tool === 'highlight') return 'hl';
        if (tool === 'whiteout') return 'wo';
        if (tool === 'rect' || tool === 'ellipse') return 'shape';
        if (tool === 'line' || tool === 'draw') return 'line';
        return '';
    }, [selAnn, tool]);

    const val = <K extends keyof Style>(key: K): Style[K] => {
        if (selAnn) {
            const a: any = selAnn;
            if (key === 'hl' || key === 'wo') return (a.fill ?? style[key]) as Style[K];
            if (key in a) return a[key];
        }
        return style[key];
    };

    /* ---------- pointer ---------- */
    const pt = (e: RPE) => {
        const r = layerRef.current!.getBoundingClientRect();
        return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
    };

    const hitTest = (x: number, y: number): Ann | null => {
        const list = annsRef.current[pageIdx] || [];
        for (let i = list.length - 1; i >= 0; i--) if (hits(list[i], x, y)) return list[i];
        return null;
    };

    const makeDraft = (id: string, x1: number, y1: number, x2: number, y2: number): Ann => {
        if (tool === 'line') return { id, type: 'line', x1, y1, x2, y2, stroke: style.stroke, strokeW: style.strokeW, opacity: style.opacity };
        const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
        if (tool === 'highlight') return { id, type: 'shape', kind: 'highlight', x, y, w, h, fill: style.hl, stroke: '', strokeW: 0, opacity: 1 };
        if (tool === 'whiteout') return { id, type: 'shape', kind: 'whiteout', x, y, w, h, fill: style.wo, stroke: '', strokeW: 0, opacity: 1 };
        return { id, type: 'shape', kind: tool === 'ellipse' ? 'ellipse' : 'rect', x, y, w, h, fill: style.fill, stroke: style.stroke, strokeW: style.strokeW, opacity: style.opacity };
    };

    const onPointerDown = (e: RPE) => {
        if (!pageSize || e.button !== 0) return;
        const { x, y } = pt(e);
        const cap = () => layerRef.current?.setPointerCapture(e.pointerId);

        if (tool === 'select') {
            const hit = hitTest(x, y);
            if (hit) {
                setSelected(hit.id);
                dragRef.current = { mode: 'move', id: hit.id, sx: x, sy: y, orig: hit, snap: annsRef.current, moved: false };
                cap();
            } else {
                setSelected(null);
            }
            return;
        }
        if (tool === 'text') {
            e.preventDefault();
            pendingText.current = { x, y };
            return;
        }
        if (tool === 'draw') {
            const id = uid();
            const d: DrawAnn = { id, type: 'draw', points: [[x, y]], stroke: style.stroke, strokeW: style.strokeW, opacity: style.opacity };
            dragRef.current = { mode: 'draw', id };
            draftRef.current = d;
            setDraft(d);
            cap();
            return;
        }
        if (['rect', 'ellipse', 'highlight', 'whiteout', 'line'].includes(tool)) {
            const id = uid();
            dragRef.current = { mode: 'create', sx: x, sy: y, id };
            const d = makeDraft(id, x, y, x, y);
            draftRef.current = d;
            setDraft(d);
            cap();
        }
    };

    const onPointerMove = (e: RPE) => {
        const d = dragRef.current;
        if (!d) return;
        const { x, y } = pt(e);
        if (d.mode === 'move') {
            const dx = x - d.sx, dy = y - d.sy;
            if (!d.moved && Math.hypot(dx, dy) * k < 3) return;
            d.moved = true;
            live((l) => l.map((a) => (a.id === d.id ? translateAnn(d.orig, dx, dy) : a)));
        } else if (d.mode === 'resize') {
            const dx = x - d.sx, dy = y - d.sy;
            d.moved = true;
            const nw = Math.max(8, d.orig.w + dx);
            const nh = d.orig.type === 'image' ? (nw * d.orig.h) / d.orig.w : Math.max(8, d.orig.h + dy);
            live((l) => l.map((a) => (a.id === d.id ? ({ ...d.orig, w: nw, h: nh } as Ann) : a)));
        } else if (d.mode === 'create') {
            const nd = makeDraft(d.id, d.sx, d.sy, x, y);
            draftRef.current = nd;
            setDraft(nd);
        } else {
            const cur = draftRef.current as DrawAnn | null;
            if (!cur) return;
            const last = cur.points[cur.points.length - 1];
            if (Math.hypot(x - last[0], y - last[1]) < 1) return;
            const nd: DrawAnn = { ...cur, points: [...cur.points, [x, y]] };
            draftRef.current = nd;
            setDraft(nd);
        }
    };

    const onPointerUp = () => {
        if (tool === 'text' && pendingText.current) {
            const { x, y } = pendingText.current;
            pendingText.current = null;
            const hit = hitTest(x, y);
            if (hit && hit.type === 'text') {
                pushHistory(annsRef.current);
                justCreated.current = null;
                startEdit(hit.id);
                return;
            }
            const id = uid();
            const t: TextAnn = {
                id, type: 'text', x, y: y - style.size * 0.5, text: '', font: style.font, size: style.size,
                color: style.color, bold: style.bold, italic: style.italic,
            };
            update((l) => [...l, t]);
            justCreated.current = id;
            startEdit(id);
            return;
        }

        const d = dragRef.current;
        dragRef.current = null;
        if (!d) return;
        if (d.mode === 'move' || d.mode === 'resize') {
            if (d.moved) pushHistory(d.snap);
            return;
        }
        const nd = draftRef.current;
        draftRef.current = null;
        setDraft(null);
        if (!nd) return;
        const b = bboxOf(nd);
        if (nd.type === 'draw' || Math.max(b.w, b.h) >= 3) update((l) => [...l, nd]);
    };

    const onDoubleClick = (e: RPE) => {
        const { x, y } = pt(e);
        const hit = hitTest(x, y);
        if (hit && hit.type === 'text') {
            pushHistory(annsRef.current);
            justCreated.current = null;
            startEdit(hit.id);
        }
    };

    const startResize = (e: RPE, a: ShapeAnn | ImageAnn) => {
        e.stopPropagation();
        const { x, y } = pt(e);
        dragRef.current = { mode: 'resize', id: a.id, sx: x, sy: y, orig: a, snap: annsRef.current, moved: false };
        layerRef.current?.setPointerCapture(e.pointerId);
    };

    const finishEditing = (id: string) => {
        setEditing(null);
        const a = (annsRef.current[pageIdx] || []).find((x) => x.id === id);
        if (a && a.type === 'text' && a.text.trim() === '') {
            live((l) => l.filter((x) => x.id !== id));
            if (justCreated.current === id) past.current.pop();
            setSelected(null);
            setHistVer((v) => v + 1);
        }
        justCreated.current = null;
    };

    /* ---------- edit existing text ---------- */
    const editSeg = (s: Seg) => {
        const canvas = pdfCanvasRef.current;
        const f = canvas && pageSize ? canvas.width / pageSize.w : 1;
        const size = s.size;
        const top = s.base - size * 0.92;
        const hgt = size * 1.25;
        const col = canvas ? sampleColors(canvas, f, s.x, top, s.w, hgt) : { bg: '#ffffff', fg: '#000000' };
        const wo: ShapeAnn = {
            id: uid(), type: 'shape', kind: 'whiteout', x: s.x - 1.5, y: top, w: s.w + 3, h: hgt,
            fill: col.bg, stroke: '', strokeW: 0, opacity: 1,
        };
        const id = uid();
        const t: TextAnn = {
            id, type: 'text', x: s.x, y: s.base - size * 0.94, text: s.text, font: s.font, size,
            color: col.fg, bold: false, italic: false,
        };
        if (s.rtl) t.x = s.x + s.w - measureTextAnn(t).w;
        update((l) => [...l, wo, t]);
        justCreated.current = null;
        startEdit(id);
    };

    const visibleSegs = useMemo(
        () => segs.filter((s) => {
            const cx = s.x + s.w / 2, cy = s.base - s.size * 0.3;
            return !pageAnns.some((a) => a.type === 'shape' && a.kind === 'whiteout' && cx >= a.x && cx <= a.x + a.w && cy >= a.y && cy <= a.y + a.h);
        }),
        [segs, pageAnns]
    );

    /* ---------- image ---------- */
    const onImagePicked = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f || !pageSize) return;
        const reader = new FileReader();
        reader.onload = () => {
            const im = new Image();
            im.onload = () => {
                const sc = Math.min(1, 2000 / Math.max(im.width, im.height));
                const c = document.createElement('canvas');
                c.width = Math.round(im.width * sc);
                c.height = Math.round(im.height * sc);
                c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
                const w = Math.min(pageSize.w * 0.4, im.width * 0.75);
                const h = (w * im.height) / im.width;
                const id = uid();
                const a: ImageAnn = { id, type: 'image', x: (pageSize.w - w) / 2, y: (pageSize.h - h) / 2, w, h, src: c.toDataURL('image/png'), opacity: 1 };
                update((l) => [...l, a]);
                setTool('select');
                setSelected(id);
            };
            im.src = String(reader.result);
        };
        reader.readAsDataURL(f);
    };

    /* ---------- save ---------- */
    const handleSave = async () => {
        if (!file || !docRef.current) return;
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(0);
        setMessage('Preparing...');
        setStatus('processing');
        await tick();
        try {
            const blob = await exportPdf({
                file, doc: docRef.current, anns: annsRef.current, imgs: imgs.current, flatten, pageCount,
                onProgress: (p, m) => { setProgress(p); setMessage(m); },
                isCancelled: () => cancelRef.current,
            });
            if (!blob || cancelRef.current) return;
            setResult(blob);
            setProgress(100);
            await new Promise((r) => setTimeout(r, 300));
            setStatus('done');
        } catch (e) {
            console.error(e);
            setModalError('Failed to save the PDF. Try Secure flatten or fewer edits.');
            setStatus('error');
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus('idle'); setProgress(0); };
    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const resetAll = () => {
        loadToken.current++;
        if (taskRef.current) { try { taskRef.current.destroy(); } catch { /* ignore */ } }
        docRef.current = null;
        taskRef.current = null;
        annsRef.current = {};
        past.current = [];
        future.current = [];
        setFile(null);
        setAnns({});
        setThumbs({});
        setSelected(null);
        setEditing(null);
        setDraft(null);
        setPageSize(null);
        setResult(null);
        setStatus('idle');
        setProgress(0);
        setLoadError(null);
    };

    const totalEdits = Object.values(anns).reduce((s, l) => s + l.length, 0);
    const safeName = (outName.trim() || 'edited').replace(/[\\/:*?"<>|]/g, '_');
    const inputCls = 'px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400';
    const btnCls = 'p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed';
    const lbl = 'flex items-center gap-1 text-xs font-semibold text-gray-600';
    const canUndo = past.current.length > 0;
    const canRedo = future.current.length > 0;
    void histVer;

    const fontCssFor = (a: TextAnn): React.CSSProperties => ({
        fontSize: a.size * k, lineHeight: 1.2, color: a.color, fontWeight: a.bold ? 700 : 400,
        fontStyle: a.italic ? 'italic' : 'normal', fontFamily: CSS_FONT[a.font], whiteSpace: 'pre',
        direction: RTL_RE.test(a.text) ? 'rtl' : 'ltr', unicodeBidi: 'plaintext',
    });

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-3 sm:px-6">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl mb-3">
                        <Type className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Edit PDF</h1>
                    <p className="text-gray-600 mt-2">
                        Edit text, add text in any language, highlight, whiteout, draw and insert images. Free, and your PDF never leaves your browser.
                    </p>
                </div>

                {!file ? (
                    <FileDropzone onFiles={loadFile} multiple={false} label="Click to select a PDF file" />
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                <p className="text-xs text-orange-700 font-medium">{pageCount} pages · {formatBytes(file.size)} · {totalEdits} edits</p>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-600 hover:underline font-medium shrink-0">Change file</button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {TOOLS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => selectTool(t.key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium ${tool === t.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <t.icon className="w-4 h-4" /> {t.label}
                                </button>
                            ))}
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium bg-white border-gray-200 hover:bg-gray-100 text-gray-700">
                                <ImagePlus className="w-4 h-4" /> Image
                            </button>
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImagePicked} />
                            <span className="mx-1 h-6 w-px bg-gray-200" />
                            <button type="button" className={btnCls} onClick={undo} disabled={!canUndo} title="Undo"><Undo2 className="w-4 h-4" /></button>
                            <button type="button" className={btnCls} onClick={redo} disabled={!canRedo} title="Redo"><Redo2 className="w-4 h-4" /></button>
                            <button type="button" className={btnCls} onClick={deleteSelected} disabled={!selected} title="Delete selected"><Trash2 className="w-4 h-4" /></button>
                            <span className="mx-1 h-6 w-px bg-gray-200" />
                            <button type="button" className={btnCls} onClick={() => setZoom((z) => clamp(z - 0.1, 0.3, 3))} title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
                            <span className="text-xs text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button type="button" className={btnCls} onClick={() => setZoom((z) => clamp(z + 0.1, 0.3, 3))} title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
                            <button type="button" className="px-2 py-2 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-100" onClick={fitZoom}>Fit</button>
                            <span className="mx-1 h-6 w-px bg-gray-200" />
                            <button type="button" className={btnCls} onClick={() => gotoPage(pageIdx - 1)} disabled={pageIdx === 0}><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm text-gray-700">{pageIdx + 1} / {pageCount}</span>
                            <button type="button" className={btnCls} onClick={() => gotoPage(pageIdx + 1)} disabled={pageIdx >= pageCount - 1}><ChevronRight className="w-4 h-4" /></button>
                        </div>

                        {group && (
                            <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl border border-gray-200 bg-gray-50">
                                {group === 'text' && (
                                    <>
                                        <label className={lbl}>Font
                                            <select className={inputCls} value={val('font')} onChange={(e) => applyStyle({ font: e.target.value as Style['font'] })}>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Times">Times</option>
                                                <option value="Courier">Courier</option>
                                                <option value="Unicode">Any language (Arabic, Tamil...)</option>
                                            </select>
                                        </label>
                                        <label className={lbl}>Size
                                            <input type="number" min={4} max={200} className={`${inputCls} w-20`} value={Math.round(val('size'))} onChange={(e) => applyStyle({ size: clamp(Number(e.target.value) || 12, 4, 200) })} />
                                        </label>
                                        <label className={lbl}>Color
                                            <input type="color" value={val('color')} onChange={(e) => applyStyle({ color: e.target.value })} />
                                        </label>
                                        <button type="button" className={`${btnCls} ${val('bold') ? '!bg-orange-100' : ''}`} onClick={() => applyStyle({ bold: !val('bold') })}><Bold className="w-4 h-4" /></button>
                                        <button type="button" className={`${btnCls} ${val('italic') ? '!bg-orange-100' : ''}`} onClick={() => applyStyle({ italic: !val('italic') })}><Italic className="w-4 h-4" /></button>
                                    </>
                                )}
                                {group === 'shape' && (
                                    <>
                                        <label className={lbl}>
                                            <input type="checkbox" checked={val('fill') !== ''} onChange={(e) => applyStyle({ fill: e.target.checked ? '#fef3c7' : '' })} /> Fill
                                            <input type="color" value={val('fill') || '#fef3c7'} onChange={(e) => applyStyle({ fill: e.target.value })} />
                                        </label>
                                        <label className={lbl}>Border
                                            <input type="color" value={val('stroke')} onChange={(e) => applyStyle({ stroke: e.target.value })} />
                                        </label>
                                        <label className={lbl}>Width
                                            <input type="number" min={0} max={30} className={`${inputCls} w-16`} value={val('strokeW')} onChange={(e) => applyStyle({ strokeW: clamp(Number(e.target.value) || 0, 0, 30) })} />
                                        </label>
                                        <label className={lbl}>Opacity
                                            <input type="range" min={0.1} max={1} step={0.05} value={val('opacity')} onChange={(e) => applyStyle({ opacity: Number(e.target.value) })} />
                                        </label>
                                    </>
                                )}
                                {group === 'line' && (
                                    <>
                                        <label className={lbl}>Color
                                            <input type="color" value={val('stroke')} onChange={(e) => applyStyle({ stroke: e.target.value })} />
                                        </label>
                                        <label className={lbl}>Width
                                            <input type="number" min={1} max={30} className={`${inputCls} w-16`} value={val('strokeW')} onChange={(e) => applyStyle({ strokeW: clamp(Number(e.target.value) || 1, 1, 30) })} />
                                        </label>
                                        <label className={lbl}>Opacity
                                            <input type="range" min={0.1} max={1} step={0.05} value={val('opacity')} onChange={(e) => applyStyle({ opacity: Number(e.target.value) })} />
                                        </label>
                                    </>
                                )}
                                {group === 'hl' && (
                                    <label className={lbl}>Highlight color
                                        <input type="color" value={val('hl')} onChange={(e) => applyStyle({ hl: e.target.value })} />
                                    </label>
                                )}
                                {group === 'wo' && (
                                    <label className={lbl}>Cover color
                                        <input type="color" value={val('wo')} onChange={(e) => applyStyle({ wo: e.target.value })} />
                                    </label>
                                )}
                                {group === 'image' && (
                                    <label className={lbl}>Opacity
                                        <input type="range" min={0.1} max={1} step={0.05} value={val('opacity')} onChange={(e) => applyStyle({ opacity: Number(e.target.value) })} />
                                    </label>
                                )}
                            </div>
                        )}

                        {tool === 'text' && (
                            <p className="text-xs text-gray-500">Click on the page where you want the text, then type. Press Escape or click elsewhere when done. Use Select to move it.</p>
                        )}
                        {tool === 'edit' && (
                            <p className="text-xs text-gray-500">
                                {pageSize && pageSize.rot !== 0
                                    ? 'Edit text is not available on rotated pages. Use Add text with Whiteout instead.'
                                    : 'Click a highlighted line of text to edit it. The original is covered, not deleted. Use Secure flatten when saving for sensitive content.'}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <div className="hidden md:block w-28 shrink-0 max-h-[75vh] overflow-y-auto space-y-2 pr-1">
                                {Array.from({ length: pageCount }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => gotoPage(i)}
                                        className={`relative w-full aspect-[3/4] rounded-lg border-2 overflow-hidden bg-white flex items-center justify-center ${i === pageIdx ? 'border-orange-500' : 'border-gray-200'}`}
                                    >
                                        {thumbs[i] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumbs[i]} alt={`Page ${i + 1}`} className="w-full h-full object-contain" draggable={false} />
                                        ) : (
                                            <span className="text-xs text-gray-400">…</span>
                                        )}
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">{i + 1}</span>
                                        {(anns[i] || []).length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                    </button>
                                ))}
                            </div>

                            <div ref={scrollRef} className="flex-1 min-w-0 overflow-auto bg-gray-200 rounded-xl p-4" style={{ maxHeight: '75vh' }}>
                                <div className="relative mx-auto bg-white shadow" style={{ width: (pageSize?.w || 0) * k, height: (pageSize?.h || 0) * k }}>
                                    <canvas ref={pdfCanvasRef} className="absolute left-0 top-0" />
                                    <canvas ref={annCanvasRef} className="absolute left-0 top-0 pointer-events-none" />

                                    {pageAnns.filter((a): a is TextAnn => a.type === 'text').map((a) => {
                                        if (editing === a.id) {
                                            const m = measureTextAnn(a);
                                            return (
                                                <textarea
                                                    key={a.id}
                                                    ref={textRef}
                                                    autoFocus
                                                    dir="auto"
                                                    placeholder="Type here"
                                                    value={a.text}
                                                    onChange={(e) => live((l) => l.map((x) => (x.id === a.id ? { ...x, text: e.target.value } : x)))}
                                                    onBlur={() => {
                                                        if (Date.now() - editStart.current < 300) {
                                                            setTimeout(() => textRef.current?.focus(), 0);
                                                            return;
                                                        }
                                                        finishEditing(a.id);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') { e.preventDefault(); finishEditing(a.id); }
                                                        e.stopPropagation();
                                                    }}
                                                    style={{
                                                        ...fontCssFor(a), position: 'absolute', left: a.x * k, top: a.y * k, zIndex: 30,
                                                        width: Math.max(m.w * k + 28, 120), height: m.h * k + 6, padding: 0, margin: 0, resize: 'none',
                                                        overflow: 'hidden', outline: 'none', border: '1px dashed #f97316', background: 'rgba(255,255,255,0.85)',
                                                    }}
                                                />
                                            );
                                        }
                                        return (
                                            <div key={a.id} style={{ ...fontCssFor(a), position: 'absolute', left: a.x * k, top: a.y * k, zIndex: 5, pointerEvents: 'none' }}>
                                                {a.text}
                                            </div>
                                        );
                                    })}

                                    {selAnn && editing !== selAnn.id && (() => {
                                        const b = bboxOf(selAnn);
                                        const resizable = selAnn.type === 'image' || selAnn.type === 'shape';
                                        return (
                                            <>
                                                <div style={{ position: 'absolute', left: b.x * k - 3, top: b.y * k - 3, width: b.w * k + 6, height: b.h * k + 6, border: '1px dashed #f97316', zIndex: 20, pointerEvents: 'none' }} />
                                                {resizable && (
                                                    <div
                                                        onPointerDown={(e) => startResize(e, selAnn as ShapeAnn | ImageAnn)}
                                                        style={{ position: 'absolute', left: (b.x + b.w) * k - 6, top: (b.y + b.h) * k - 6, width: 12, height: 12, background: '#f97316', borderRadius: 2, cursor: 'nwse-resize', zIndex: 21, touchAction: 'none' }}
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}

                                    {tool === 'edit' && pageSize && pageSize.rot === 0 && visibleSegs.map((s, i) => (
                                        <div
                                            key={i}
                                            onClick={() => editSeg(s)}
                                            title="Click to edit"
                                            className="border border-transparent hover:border-orange-500 hover:bg-orange-300/30"
                                            style={{ position: 'absolute', left: s.x * k - 1, top: (s.base - s.size * 0.92) * k, width: s.w * k + 2, height: s.size * 1.25 * k, cursor: 'text', zIndex: 15 }}
                                        />
                                    ))}

                                    <div
                                        ref={layerRef}
                                        onPointerDown={onPointerDown}
                                        onPointerMove={onPointerMove}
                                        onPointerUp={onPointerUp}
                                        onDoubleClick={onDoubleClick as any}
                                        style={{
                                            position: 'absolute', inset: 0, zIndex: 10, touchAction: 'none',
                                            pointerEvents: tool === 'edit' ? 'none' : 'auto',
                                            cursor: tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                            <label className="flex items-start gap-2 text-sm text-gray-700 lg:max-w-md">
                                <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className="mt-1 accent-orange-500" />
                                <span>
                                    <b>Secure flatten</b>: turn pages into images so covered text is permanently removed. Text will no longer be selectable.
                                </span>
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden lg:w-72">
                                <input value={outName} onChange={(e) => setOutName(e.target.value)} className="flex-1 px-3 py-3 text-sm focus:outline-none min-w-0" placeholder="File name" />
                                <span className="px-3 text-sm text-gray-500 bg-gray-50 py-3">.pdf</span>
                            </div>
                            <div className="flex-1">
                                <ProcessButton onClick={handleSave} loading={status === 'processing'} disabled={!file} label="Save PDF" loadingLabel="Saving..." />
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
                title="Saving your PDF"
                message={message}
                blob={result}
                filename={`${safeName}.pdf`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />

            <ToolSeoContent
                id="edit-pdf"
                steps={[
                    'Click the upload area to select the PDF you want to edit.',
                    'Choose Edit text and click a line to change it, or use Add text, Highlight, Whiteout, Draw and Image.',
                    'Select, move or resize anything you added. Undo and redo are always available.',
                    'Click Save PDF. Turn on Secure flatten if you covered sensitive text.',
                ]}
            />
        </main>
    );
}