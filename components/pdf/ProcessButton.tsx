// components/pdf/ProcessButton.tsx
'use client';
import { Loader2 } from 'lucide-react';

interface Props {
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
    label: string;
    loadingLabel?: string;
}

export default function ProcessButton({ onClick, loading, disabled, label, loadingLabel = 'Processing...' }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>{loadingLabel}</span></>) : <span>{label}</span>}
        </button>
    );
}