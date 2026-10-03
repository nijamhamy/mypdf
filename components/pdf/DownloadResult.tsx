// components/pdf/DownloadResult.tsx
'use client';
import { Download, RotateCcw } from 'lucide-react';
import { downloadBlob, formatBytes } from '@/lib/pdf-utils';

interface Props {
    blob: Blob;
    filename: string;
    title?: string;
    onReset?: () => void;
}

export default function DownloadResult({ blob, filename, title = 'Your file is ready!', onReset }: Props) {
    return (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
            <h3 className="text-xl font-bold text-green-800 mb-1">{title}</h3>
            <p className="text-sm text-green-700 mb-4">{filename} · {formatBytes(blob.size)}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    type="button"
                    onClick={() => downloadBlob(blob, filename)}
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md"
                >
                    <Download className="w-5 h-5" /><span>Download</span>
                </button>
                {onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl"
                    >
                        <RotateCcw className="w-4 h-4" /><span>Start over</span>
                    </button>
                )}
            </div>
        </div>
    );
}