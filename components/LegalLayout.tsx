import Link from 'next/link';
import type { ReactNode } from 'react';

interface LayoutProps {
    title: string;
    updated?: string;
    intro?: string;
    sections?: { id: string; title: string }[];
    children: ReactNode;
}

export function LegalLayout({ title, updated, intro, sections, children }: LayoutProps) {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
                    <Link href="/" className="hover:text-blue-600">Home</Link> <span aria-hidden="true">/</span>{' '}
                    <span className="text-gray-700">{title}</span>
                </nav>

                <header>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
                    {updated && <p className="text-sm text-gray-500 mt-2">Last updated: {updated}</p>}
                    {intro && <p className="text-lg text-gray-600 mt-4 leading-relaxed">{intro}</p>}
                </header>

                {sections && sections.length > 0 && (
                    <nav aria-label="On this page" className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Contents</p>
                        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 list-decimal pl-5 text-sm">
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <a href={`#${s.id}`} className="text-blue-700 hover:underline">{s.title}</a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                <article className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-10">
                    {children}
                </article>
            </div>
        </main>
    );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_a]:text-blue-600 [&_a]:underline">
                {children}
            </div>
        </section>
    );
}