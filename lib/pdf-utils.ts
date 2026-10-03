import { PDFDocument } from 'pdf-lib';

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function bytesToBlob(bytes: Uint8Array, type = 'application/pdf') {
    return new Blob([bytes as unknown as BlobPart], { type });
}

/** "1-3, 5, 8-10" -> [0,1,2,4,7,8,9] (zero-based). Returns null if invalid. */
export function parsePageRange(input: string, total: number): number[] | null {
    const text = input.trim();
    if (!text) return Array.from({ length: total }, (_, i) => i);
    const result: number[] = [];
    for (const part of text.split(',')) {
        const p = part.trim();
        if (!p) continue;
        const m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!m) return null;
        const start = parseInt(m[1], 10);
        const end = m[2] ? parseInt(m[2], 10) : start;
        if (start < 1 || end < 1 || start > total || end > total) return null;
        if (start <= end) for (let i = start; i <= end; i++) result.push(i - 1);
        else for (let i = start; i >= end; i--) result.push(i - 1);
    }
    return result.length ? result : null;
}

export async function getPdfPageCount(file: File): Promise<number> {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    return doc.getPageCount();
}

export async function renderPdfThumbnails(
    file: File,
    onThumb: (pageIndex: number, dataUrl: string) => void,
    shouldCancel: () => boolean = () => false,
    width = 140
) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();

    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data });
    const doc = await loadingTask.promise;
    for (let i = 1; i <= doc.numPages; i++) {
        if (shouldCancel()) break;
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: width / base.width });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        onThumb(i - 1, canvas.toDataURL('image/jpeg', 0.7));
    }
    await loadingTask.destroy();
}