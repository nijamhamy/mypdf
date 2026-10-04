'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { Hash, FileText, AlertCircle } from 'lucide-react';
import FileDropzone from '@/components/pdf/FileDropzone';
import ProcessButton from '@/components/pdf/ProcessButton';
import ProcessingModal, { ProcessStatus } from '@/components/pdf/ProcessingModal';
import {
    formatBytes, bytesToBlob, parsePageRange, renderPdfThumbnails,
} from '@/lib/pdf-utils';
import ToolSeoContent from '@/components/ToolSeoContent';

type Position = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';
type NumStyle = 'arabic' | 'romanLower' | 'romanUpper' | 'alphaLower' | 'alphaUpper';
type Template = 'n' | 'page' | 'pageOf' | 'slash' | 'dash' | 'custom';
type FontKey = 'helvetica' | 'helveticaBold' | 'times' | 'timesBold' | 'courier';

const tick = () => new Promise<void>((r) => setTimeout(r, 20));

const POSITIONS: { key: Position; label: string }[] = [
    { key: 'tl', label: 'Top left' }, { key: 'tc', label: 'Top center' }, { key: 'tr', label: 'Top right' },
    { key: 'bl', label: 'Bottom left' }, { key: 'bc', label: 'Bottom center' }, { key: 'br', label: 'Bottom right' },
];

const FONTS: Record<FontKey, { label: string; std: StandardFonts; css: string; weight: number }> = {
    helvetica: { label: 'Helvetica', std: StandardFonts.Helvetica, css: 'Helvetica, Arial, sans-serif', weight: 400 },
    helveticaBold: { label: 'Helvetica Bold', std: StandardFonts.HelveticaBold, css: 'Helvetica, Arial, sans-serif', weight: 700 },
    times: { label: 'Times Roman', std: StandardFonts.TimesRoman, css: 'Times New Roman, serif', weight: 400 },
    timesBold: { label: 'Times Bold', std: StandardFonts.TimesRomanBold, css: 'Times New Roman, serif', weight: 700 },
    courier: { label: 'Courier', std: StandardFonts.Courier, css: 'Courier New, monospace', weight: 400 },
};

function toRoman(num: number): string {
    if (num <= 0) return String(num);
    const map: [number, string][] = [
        [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
        [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
    ];
    let n = num;
    let out = '';
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
}

function toAlpha(num: number): string {
    if (num <= 0) return String(num);
    let n = num;
    let out = '';
    while (n > 0) {
        const r = (n - 1) % 26;
        out = String.fromCharCode(97 + r) + out;
        n = Math.floor((n - 1) / 26);
    }
    return out;
}

function styleNumber(n: number, style: NumStyle): string {
    switch (style) {
        case 'romanLower': return toRoman(n);
        case 'romanUpper': return toRoman(n).toUpperCase();
        case 'alphaLower': return toAlpha(n);
        case 'alphaUpper': return toAlpha(n).toUpperCase();
        default: return String(n);
    }
}

function buildText(template: Template, custom: string, n: number, total: number, style: NumStyle): string {
    const ns = styleNumber(n, style);
    const ts = styleNumber(total, style);
    let t: string;
    switch (template) {
        case 'page': t = `Page ${ns}`; break;
        case 'pageOf': t = `Page ${ns} of ${ts}`; break;
        case 'slash': t = `${ns} / ${ts}`; break;
        case 'dash': t = `- ${ns} -`; break;
        case 'custom': t = (custom || '{n}').replace(/\{n\}/g, ns).replace(/\{total\}/g, ts); break;
        default: t = ns;
    }
    return t.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

export default function AddPageNumbersPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
    const [thumb, setThumb] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [position, setPosition] = useState<Position>('bc');
    const [mirror, setMirror] = useState(false);
    const [numStyle, setNumStyle] = useState<NumStyle>('arabic');
    const [template, setTemplate] = useState<Template>('pageOf');
    const [custom, setCustom] = useState('Page {n} of {total}');
    const [startNum, setStartNum] = useState(1);
    const [range, setRange] = useState('');
    const [skipFirst, setSkipFirst] = useState(false);
    const [fontKey, setFontKey] = useState<FontKey>('helvetica');
    const [fontSize, setFontSize] = useState(12);
    const [color, setColor] = useState('#444444');
    const [margin, setMargin] = useState(30);
    const [outName, setOutName] = useState('numbered');

    const [status, setStatus] = useState<ProcessStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const cancelRef = useRef(false);
    const loadToken = useRef(0);

    const loadFile = async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        const token = ++loadToken.current;
        setLoadError(null);
        setThumb(null);
        try {
            const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
            const first = doc.getPage(0);
            const { width, height } = first.getSize();
            setFile(f);
            setPageCount(doc.getPageCount());
            setPageSize({ w: width, h: height });
            setRange('');
            let got = false;
            renderPdfThumbnails(
                f,
                (_i, url) => { if (token === loadToken.current) { setThumb(url); } got = true; },
                () => got || token !== loadToken.current,
                420
            ).catch(() => { /* preview is optional */ });
        } catch {
            setLoadError('This PDF could not be read. It may be corrupted or password protected.');
        }
    };

    const rangeIndices = useMemo(() => {
        if (!pageCount) return null;
        return parsePageRange(range, pageCount);
    }, [range, pageCount]);

    const rangeInvalid = range.trim() !== '' && rangeIndices === null;

    const targetIndices = useMemo(() => {
        const base = rangeIndices ?? [];
        const sorted = Array.from(new Set(base)).sort((a, b) => a - b);
        return skipFirst ? sorted.filter((i) => i !== 0) : sorted;
    }, [rangeIndices, skipFirst]);

    const lastNumber = startNum + Math.max(targetIndices.length, 1) - 1;
    const previewText = buildText(template, custom, startNum, lastNumber, numStyle);

    const PREVIEW_W = 280;
    const scale = pageSize ? PREVIEW_W / pageSize.w : 1;
    const previewH = pageSize ? pageSize.h * scale : 0;

    const previewStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            fontSize: fontSize * scale,
            color,
            fontFamily: FONTS[fontKey].css,
            fontWeight: FONTS[fontKey].weight,
            lineHeight: 1,
            whiteSpace: 'nowrap',
        };
        const m = margin * scale;
        if (position.startsWith('t')) base.top = m; else base.bottom = m;
        if (position.endsWith('l')) base.left = m;
        else if (position.endsWith('r')) base.right = m;
        else { base.left = '50%'; base.transform = 'translateX(-50%)'; }
        return base;
    };

    const handleProcess = async () => {
        if (!file) return;
        cancelRef.current = false;
        setResult(null);
        setModalError(null);
        setProgress(0);
        setMessage('Loading PDF...');
        setStatus('processing');
        await tick();

        try {
            const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
            const font: PDFFont = await pdf.embedFont(FONTS[fontKey].std);
            const pages = pdf.getPages();
            const textColor = hexToRgb(color);
            const total = targetIndices.length;
            const last = startNum + total - 1;

            for (let k = 0; k < total; k++) {
                if (cancelRef.current) return;
                const pageIndex = targetIndices[k];
                const page = pages[pageIndex];
                const { width, height } = page.getSize();
                const text = buildText(template, custom, startNum + k, last, numStyle);
                const tw = font.widthOfTextAtSize(text, fontSize);

                let hAlign = position.slice(1) as 'l' | 'c' | 'r';
                if (mirror && pageIndex % 2 === 1) {
                    if (hAlign === 'l') hAlign = 'r';
                    else if (hAlign === 'r') hAlign = 'l';
                }
                const x = hAlign === 'l' ? margin : hAlign === 'r' ? width - margin - tw : (width - tw) / 2;
                const y = position.startsWith('t') ? height - margin - fontSize : margin;

                page.drawText(text, { x, y, size: fontSize, font, color: textColor });

                if (k % 10 === 0 || k === total - 1) {
                    setMessage(`Numbering page ${k + 1} of ${total}`);
                    setProgress(((k + 1) / total) * 90);
                    await tick();
                }
            }

            if (cancelRef.current) return;
            setMessage('Saving PDF...');
            setProgress(95);
            await tick();
            const bytes = await pdf.save();

            if (cancelRef.current) return;
            setResult(bytesToBlob(bytes));
            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            setStatus('done');
        } catch (e) {
            console.error(e);
            setModalError('Failed to add page numbers. Please try again.');
            setStatus('error');
        }
    };

    const handleCancel = () => { cancelRef.current = true; setStatus('idle'); setProgress(0); };
    const closeModal = () => { setStatus('idle'); setModalError(null); };

    const resetAll = () => {
        loadToken.current++;
        setFile(null);
        setThumb(null);
        setPageCount(0);
        setPageSize(null);
        setResult(null);
        setStatus('idle');
        setProgress(0);
        setLoadError(null);
    };

    useEffect(() => () => { loadToken.current++; }, []);

    const safeName = (outName.trim() || 'numbered').replace(/[\\/:*?"<>|]/g, '_');
    const selectCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-500';
    const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';
    const canRun = !!file && targetIndices.length > 0 && !rangeInvalid;

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl mb-4">
                        <Hash className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Add Page Numbers to PDF</h1>
                    <p className="text-gray-600 mt-2">
                        Choose position, style and format, then check the live preview before you apply.
                    </p>
                </div>

                {!file ? (
                    <FileDropzone onFiles={loadFile} multiple={false} label="Click to select a PDF file" />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl border border-pink-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-6 h-6 text-pink-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-pink-700 font-medium">
                                        {pageCount} pages · {formatBytes(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={resetAll} className="text-sm text-red-600 hover:underline font-medium shrink-0">
                                Change file
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                            <div className="space-y-5 order-2 lg:order-1">
                                <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Position</h4>
                                    <div className="grid grid-cols-3 gap-2 max-w-sm">
                                        {POSITIONS.map((p) => (
                                            <button
                                                type="button"
                                                key={p.key}
                                                onClick={() => setPosition(p.key)}
                                                className={`px-2 py-2 text-xs rounded-lg border ${position === p.key
                                                        ? 'bg-pink-600 text-white border-pink-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                    <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="accent-pink-600" />
                                        Mirror left/right on even pages (book layout)
                                    </label>
                                </section>

                                <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Format</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>Number style</label>
                                            <select value={numStyle} onChange={(e) => setNumStyle(e.target.value as NumStyle)} className={selectCls}>
                                                <option value="arabic">1, 2, 3</option>
                                                <option value="romanLower">i, ii, iii</option>
                                                <option value="romanUpper">I, II, III</option>
                                                <option value="alphaLower">a, b, c</option>
                                                <option value="alphaUpper">A, B, C</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Text format</label>
                                            <select value={template} onChange={(e) => setTemplate(e.target.value as Template)} className={selectCls}>
                                                <option value="n">1</option>
                                                <option value="page">Page 1</option>
                                                <option value="pageOf">Page 1 of N</option>
                                                <option value="slash">1 / N</option>
                                                <option value="dash">- 1 -</option>
                                                <option value="custom">Custom…</option>
                                            </select>
                                        </div>
                                        {template === 'custom' && (
                                            <div className="col-span-2">
                                                <label className={labelCls}>Custom text — use {'{n}'} and {'{total}'}</label>
                                                <input
                                                    value={custom}
                                                    onChange={(e) => setCustom(e.target.value)}
                                                    className={selectCls}
                                                    placeholder="Invoice page {n}/{total}"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className={labelCls}>Start number</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={startNum}
                                                onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value || '1', 10)))}
                                                className={selectCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Pages to number (blank = all)</label>
                                            <input
                                                value={range}
                                                onChange={(e) => setRange(e.target.value)}
                                                placeholder="e.g. 2-10, 12"
                                                className={`${selectCls} ${rangeInvalid ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                    </div>
                                    {rangeInvalid && (
                                        <p className="mt-2 text-xs text-red-600">Use pages from 1 to {pageCount}, e.g. 1-3, 5.</p>
                                    )}
                                    <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} className="accent-pink-600" />
                                        Skip the first page (cover page)
                                    </label>
                                </section>

                                <section className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Look</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className={labelCls}>Font</label>
                                            <select value={fontKey} onChange={(e) => setFontKey(e.target.value as FontKey)} className={selectCls}>
                                                {Object.entries(FONTS).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Size (pt)</label>
                                            <input
                                                type="number" min={6} max={72} value={fontSize}
                                                onChange={(e) => setFontSize(Math.min(72, Math.max(6, parseInt(e.target.value || '12', 10))))}
                                                className={selectCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Margin (pt)</label>
                                            <input
                                                type="number" min={5} max={150} value={margin}
                                                onChange={(e) => setMargin(Math.min(150, Math.max(5, parseInt(e.target.value || '30', 10))))}
                                                className={selectCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Color</label>
                                            <input
                                                type="color" value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="w-full h-9 p-1 border border-gray-300 rounded-lg bg-white cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <aside className="order-1 lg:order-2">
                                <div className="lg:sticky lg:top-6">
                                    <p className="text-xs font-semibold text-gray-600 mb-2 text-center">Live preview (page 1)</p>
                                    <div
                                        className="relative mx-auto bg-white border border-gray-300 shadow-md overflow-hidden"
                                        style={{ width: PREVIEW_W, height: previewH || 360 }}
                                    >
                                        {thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumb} alt="Page 1" className="absolute inset-0 w-full h-full object-fill" draggable={false} />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                                Loading preview…
                                            </div>
                                        )}
                                        <span style={previewStyle()}>{previewText}</span>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 text-center">
                                        {targetIndices.length} of {pageCount} pages will be numbered
                                    </p>
                                </div>
                            </aside>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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
                                    onClick={handleProcess}
                                    loading={status === 'processing'}
                                    disabled={!canRun}
                                    label="Add Page Numbers"
                                    loadingLabel="Adding numbers..."
                                />
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
                title="Adding page numbers"
                message={message}
                blob={result}
                filename={`${safeName}.pdf`}
                errorMessage={modalError}
                onCancel={handleCancel}
                onClose={closeModal}
                onReset={resetAll}
            />

            <ToolSeoContent
                id="page-numbers"
                steps={[
                    'Click the upload area to select the PDF you want to number.',
                    'Choose one of six positions, a number style (1, i, I, a, A) and a text format such as "Page 1 of N".',
                    'Set the start number, enter the pages to number, and tick "Skip the first page" to leave the cover without a number.',
                    'Check the live preview, then click Add Page Numbers and download your PDF.',
                ]}
            />
        </main>
    );
}