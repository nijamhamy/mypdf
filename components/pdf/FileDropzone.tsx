'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface Props {
    onFiles: (files: File[]) => void;
    multiple?: boolean;
    compact?: boolean;
    label?: string;
    accept?: string;
    hint?: string;
}

function matches(file: File, accept: string) {
    const rules = accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
    const name = file.name.toLowerCase();
    return rules.some((r) => {
        if (r.startsWith('.')) return name.endsWith(r);
        if (r.endsWith('/*')) return file.type.startsWith(r.slice(0, -1));
        return file.type === r;
    });
}

export default function FileDropzone({
    onFiles,
    multiple = true,
    compact = false,
    label,
    accept = 'application/pdf,.pdf',
    hint,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handle = (list: FileList | null) => {
        if (!list) return;
        const files = Array.from(list).filter((f) => matches(f, accept));
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl text-center transition-colors ${dragging ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50/50 hover:border-red-500'
                } ${compact ? 'p-4' : 'p-10'}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={(e) => { handle(e.target.files); e.target.value = ''; }}
            />
            <div className={`flex ${compact ? 'flex-row gap-3' : 'flex-col'} items-center justify-center`}>
                <Upload className={`${compact ? 'w-6 h-6' : 'w-12 h-12 mb-3'} text-red-500`} />
                <div>
                    <p className="font-semibold text-gray-700">{label ?? 'Click to select files'}</p>
                    {!compact && (
                        <p className="text-sm text-gray-500 mt-1">{hint ?? 'or drag and drop files here'}</p>
                    )}
                </div>
            </div>
        </div>
    );
}