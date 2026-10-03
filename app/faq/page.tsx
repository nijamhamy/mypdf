import type { Metadata } from 'next';
import { HelpCircle } from 'lucide-react';
import FaqClient from './FaqClient';
import { FAQ_ITEMS } from './faq-data';

export const metadata: Metadata = {
    title: 'Frequently Asked Questions | mypdf.site',
    description:
        'Answers about mypdf.site: privacy, file limits, merging, splitting, rotating, watermarking, page numbers, and converting between PDF and images. Search and browse by topic.',
    alternates: { canonical: '/faq' },
};

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
                        Search or browse {FAQ_ITEMS.length} answers about privacy, file limits, and every tool on mypdf.site.
                    </p>
                </header>

                <FaqClient />
            </div>
        </main>
    );
}