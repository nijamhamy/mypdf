'use client';

import { useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Download, RotateCcw, X } from 'lucide-react';
import { downloadBlob, formatBytes } from '@/lib/pdf-utils';

export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';

interface Props {
    status: ProcessStatus;
    progress: number;
    title?: string;
    message?: string;
    blob?: Blob | null;
    filename?: string;
    errorMessage?: string | null;
    onCancel?: () => void;
    onClose: () => void;
    onReset?: () => void;
}

export default function ProcessingModal({
    status,
    progress,
    title = 'Processing',
    message,
    blob,
    filename = 'file.pdf',
    errorMessage,
    onCancel,
    onClose,
    onReset,
}: Props) {
    const open = status !== 'idle';
    const pct = Math.max(0, Math.min(100, Math.round(progress)));

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && status !== 'processing') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, status, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => { if (status !== 'processing') onClose(); }}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {status !== 'processing' && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {status === 'processing' && (
                    <>
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1 min-h-[1.25rem]">{message}</p>
                        <div className="mt-6 h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-600 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-gray-800">{pct}%</p>
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="mt-4 px-5 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        )}
                    </>
                )}

                {status === 'done' && blob && (
                    <>
                        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-gray-900">Your file is ready!</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {filename} · {formatBytes(blob.size)}
                        </p>
                        <div className="mt-4 h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-600 rounded-full w-full" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-green-700">100%</p>
                        <button
                            type="button"
                            onClick={() => downloadBlob(blob, filename)}
                            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-md"
                        >
                            <Download className="w-5 h-5" /> Download
                        </button>
                        <div className="mt-3 flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                            >
                                Back to edit
                            </button>
                            {onReset && (
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-1"
                                >
                                    <RotateCcw className="w-4 h-4" /> Start over
                                </button>
                            )}
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle className="w-14 h-14 text-red-600 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-gray-900">Something went wrong</h3>
                        <p className="text-sm text-gray-600 mt-2">{errorMessage ?? 'Please try again.'}</p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl"
                        >
                            Close
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}