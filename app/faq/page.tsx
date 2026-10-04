import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';
import FaqClient from './FaqClient';
import { FAQ_ITEMS } from './faq-data';


export const metadata: Metadata = {
    title: 'Frequently Asked Questions | mypdf.site',
    description:
        'Answers about mypdf.site: privacy, file limits, merging, splitting, rotating, compressing, watermarking, page numbers, editing PDFs, PDF to Word with OCR, and converting between PDF and images. Search and browse by topic.',
    alternates: { canonical: '/faq' },
};


const TOOL_LINKS: { href: string; label: string }[] = [
    { href: '/merge-pdf', label: 'Merge PDF' },
    { href: '/split-pdf', label: 'Split PDF' },
    { href: '/rotate-pdf', label: 'Rotate PDF' },
    { href: '/compress-pdf', label: 'Compress PDF' },
    { href: '/watermark-pdf', label: 'Add Watermark' },
    { href: '/page-numbers', label: 'Add Page Numbers' },
    { href: '/edit-pdf', label: 'Edit PDF' },
    { href: '/jpg-to-pdf', label: 'JPG to PDF' },
    { href: '/pdf-to-jpg', label: 'PDF to JPG' },
    { href: '/pdf-to-word', label: 'PDF to Word' },
];


export default function FAQPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    };


    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            <div className="max-w-4xl mx-auto space-y-10">
                <header className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Search or browse {FAQ_ITEMS.length} answers about privacy, file limits, converting and editing PDFs, and every tool on mypdf.site.
                    </p>
                </header>


                <section aria-labelledby="browse-tools" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                    <h2 id="browse-tools" className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Browse the tools
                    </h2>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        Every tool runs in your browser, so your files are not uploaded for processing. Open the one you need,
                        or read the step-by-step guides and the list of limits on the{' '}
                        <Link href="/features" className="text-blue-600 underline">Features page</Link>.
                    </p>
                    <ul className="flex flex-wrap gap-2">
                        {TOOL_LINKS.map((t) => (
                            <li key={t.href}>
                                <Link
                                    href={t.href}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                >
                                    {t.label} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>


                <FaqClient />


                <p className="text-center text-xs text-gray-500">
                    Last updated October 2026. Spotted something out of date?{' '}
                    <Link href="/contact" className="underline">Let us know</Link>.
                </p>
            </div>
        </main>
    );
}