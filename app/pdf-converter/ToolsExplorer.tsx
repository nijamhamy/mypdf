'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight, CheckCircle2, SearchX } from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, type ToolCategory } from '@/lib/tools';

export default function ToolsExplorer() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<ToolCategory | 'all'>('all');
    const inputRef = useRef<HTMLInputElement>(null);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: TOOLS.length };
        TOOLS.forEach((t) => { c[t.category] = (c[t.category] ?? 0) + 1; });
        return c;
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return TOOLS.filter((t) => {
            if (category !== 'all' && t.category !== category) return false;
            if (!q) return true;
            const haystack = [t.title, t.short, ...t.keywords, ...t.points].join(' ').toLowerCase();
            return q.split(/\s+/).every((word) => haystack.includes(word));
        });
    }, [query, category]);

    const chips = [
        { id: 'all' as const, label: 'All tools' },
        ...(Object.keys(CATEGORY_LABELS) as ToolCategory[]).map((id) => ({ id, label: CATEGORY_LABELS[id] })),
    ];

    return (
        <section aria-labelledby="all-tools-heading" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h2 id="all-tools-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">All PDF tools</h2>
                    <p className="text-gray-600 text-sm mt-1">Search by name or by what you want to do, for example “reduce size” or “images”.</p>
                </div>
                <span className="text-sm text-gray-500" aria-live="polite">
                    {filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}
                </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tools…"
                        aria-label="Search tools"
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tool categories">
                    {chips.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={category === c.id}
                            onClick={() => setCategory(c.id)}
                            className={`px-3.5 py-1.5 text-sm rounded-full border transition ${category === c.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {c.label}{' '}
                            <span className={category === c.id ? 'text-blue-100' : 'text-gray-400'}>({counts[c.id] ?? 0})</span>
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
                    <SearchX className="w-10 h-10 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-bold text-gray-900">No tools match your search</h3>
                    <p className="text-sm text-gray-600">Try a different word, or show every tool.</p>
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setCategory('all'); }}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Show all tools
                    </button>
                </div>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((t) => (
                        <li key={t.id}>
                            <Link
                                href={t.href}
                                className={`group h-full p-7 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${t.cardBg}`}
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm">
                                            <t.icon className={`w-8 h-8 ${t.iconColor}`} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/70 rounded-full px-2 py-0.5">
                                                {CATEGORY_LABELS[t.category]}
                                            </span>
                                            {t.badge && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                                                    {t.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.short}</p>
                                    <ul className="space-y-1.5">
                                        {t.points.map((p) => (
                                            <li key={p} className="flex gap-2 text-xs text-gray-600">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-6 flex items-center text-sm font-semibold text-blue-600">
                                    <span>Open tool</span>
                                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}