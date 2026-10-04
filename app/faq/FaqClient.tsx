'use client';


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Search, ChevronDown, ArrowRight, MessageSquare, X, Link2, Check, Plus, Minus, SearchX,
} from 'lucide-react';
import { CATEGORIES, FAQ_ITEMS, type CategoryId } from './faq-data';


function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.trim();
    if (!q) return <>{text}</>;
    const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
    return (
        <>
            {parts.map((p, i) =>
                p.toLowerCase() === q.toLowerCase()
                    ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{p}</mark>
                    : <span key={i}>{p}</span>
            )}
        </>
    );
}


export default function FaqClient() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<CategoryId | 'all'>('all');
    const [open, setOpen] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);


    const counts = useMemo(() => {
        const c: Record<string, number> = { all: FAQ_ITEMS.length };
        FAQ_ITEMS.forEach((f) => { c[f.category] = (c[f.category] ?? 0) + 1; });
        return c;
    }, []);


    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return FAQ_ITEMS.filter((f) => {
            if (category !== 'all' && f.category !== category) return false;
            if (!q) return true;
            return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
        });
    }, [query, category]);


    const grouped = useMemo(() => {
        return CATEGORIES
            .map((c) => ({ ...c, items: filtered.filter((f) => f.category === c.id) }))
            .filter((g) => g.items.length > 0);
    }, [filtered]);


    const openFromHash = useCallback(() => {
        const id = window.location.hash.replace('#', '');
        if (!id || !FAQ_ITEMS.some((f) => f.id === id)) return;
        setCategory('all');
        setQuery('');
        setOpen((prev) => new Set(prev).add(id));
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }, []);


    useEffect(() => {
        if (!window.location.hash) {
            setOpen(new Set([FAQ_ITEMS[0].id]));
        } else {
            openFromHash();
        }
        window.addEventListener('hashchange', openFromHash);
        return () => window.removeEventListener('hashchange', openFromHash);
    }, [openFromHash]);


    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
            if (e.key === '/' && !typing) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);


    useEffect(() => {
        if (query.trim()) setOpen(new Set(filtered.map((f) => f.id)));
    }, [query, filtered]);


    const toggle = (id: string) =>
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });


    const expandAll = () => setOpen(new Set(filtered.map((f) => f.id)));
    const collapseAll = () => setOpen(new Set());


    const copyLink = async (id: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
            setCopiedId(id);
            setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
        } catch {
            window.location.hash = id;
        }
    };


    const allOpen = filtered.length > 0 && filtered.every((f) => open.has(f.id));


    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        type="search"
                        placeholder="Search questions, for example “password”, “OCR” or “DPI”"
                        aria-label="Search frequently asked questions"
                        className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    {query ? (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <kbd className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">/</kbd>
                    )}
                </div>


                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Question categories">
                    {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map((c) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={category === c.id}
                            key={c.id}
                            onClick={() => setCategory(c.id)}
                            className={`px-3.5 py-1.5 text-sm rounded-full border transition ${category === c.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {c.label} <span className={category === c.id ? 'text-blue-100' : 'text-gray-400'}>({counts[c.id] ?? 0})</span>
                        </button>
                    ))}
                </div>


                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span aria-live="polite">
                        {filtered.length} {filtered.length === 1 ? 'question' : 'questions'}
                        {query.trim() && <> matching “{query.trim()}”</>}
                    </span>
                    {filtered.length > 0 && (
                        <button
                            type="button"
                            onClick={allOpen ? collapseAll : expandAll}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {allOpen ? <><Minus className="w-4 h-4" /> Collapse all</> : <><Plus className="w-4 h-4" /> Expand all</>}
                        </button>
                    )}
                </div>
            </div>


            {grouped.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
                    <SearchX className="w-10 h-10 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-bold text-gray-900">No matching questions</h3>
                    <p className="text-sm text-gray-600">Try a shorter word, or choose a different category.</p>
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setCategory('all'); }}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Reset search
                    </button>
                </div>
            ) : (
                grouped.map((g) => (
                    <section key={g.id} aria-labelledby={`cat-${g.id}`} className="space-y-3">
                        <div>
                            <h2 id={`cat-${g.id}`} className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                {g.label}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{g.description}</p>
                        </div>
                        <div className="space-y-3">
                            {g.items.map((f) => {
                                const isOpen = open.has(f.id);
                                return (
                                    <div
                                        key={f.id}
                                        id={f.id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-24"
                                    >
                                        <h3>
                                            <button
                                                type="button"
                                                onClick={() => toggle(f.id)}
                                                aria-expanded={isOpen}
                                                aria-controls={`${f.id}-panel`}
                                                className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="text-base sm:text-lg">
                                                    <Highlight text={f.question} query={query} />
                                                </span>
                                                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} />
                                            </button>
                                        </h3>
                                        {isOpen && (
                                            <div id={`${f.id}-panel`} role="region" aria-labelledby={f.id} className="px-5 pb-5 border-t border-gray-100 pt-4">
                                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                                    <Highlight text={f.answer} query={query} />
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => copyLink(f.id)}
                                                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600"
                                                >
                                                    {copiedId === f.id
                                                        ? <><Check className="w-3.5 h-3.5 text-green-600" /> Link copied</>
                                                        : <><Link2 className="w-3.5 h-3.5" /> Copy link to this answer</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))
            )}


            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center shadow-sm space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Still have questions?</h3>
                <p className="text-gray-600 max-w-md mx-auto text-sm">
                    If you could not find your answer, describe the problem and include your browser and device. We read every message.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-all"
                    >
                        <span>Contact support</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/features"
                        className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-all"
                    >
                        Read the guides
                    </Link>
                </div>
            </div>
        </div>
    );
}