import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Eye, Heart, Wrench } from 'lucide-react';
import { TOOLS } from '@/lib/tools';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'About Us | mypdf.site',
    description:
        'Learn who is behind mypdf.site, why it was built, how the browser-based PDF tools work, and how the site is funded.',
    alternates: { canonical: '/about' },
};

const PRINCIPLES = [
    { icon: ShieldCheck, title: 'Privacy first', text: 'Your documents are processed in your own browser. We designed the tools so that we never need to receive your files.' },
    { icon: Eye, title: 'Honest and transparent', text: 'We explain how the tools work, what their limits are, and how the site earns money. No hidden fees and no surprise sign-up walls.' },
    { icon: Wrench, title: 'Useful, not minimal', text: 'A simple tool should still give you control: choose pages, order, size and quality, and see a preview before you commit.' },
    { icon: Heart, title: 'Built to last', text: 'We keep improving the tools based on real feedback and fix problems that people report.' },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">About {SITE.name}</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {SITE.name} is a free set of PDF tools that run in your web browser. We built it so that everyday document jobs
                        are quick, private and easy for everyone.
                    </p>
                </header>

                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Why we built this</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Many online PDF services ask you to upload your documents to a remote server, wait in a queue, and sign up before
                        you can download the result. For contracts, invoices, ID cards and statements, that is not a comfortable trade.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        {SITE.name} takes a different approach. The work happens on your own device using modern browser technology.
                        You choose a file, set your options, and download the result. Nothing needs to be uploaded for processing.
                    </p>
                </section>

                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Who is behind the site</h2>
                    <p className="text-gray-700 leading-relaxed">
                        {SITE.name} is designed, built and maintained by an independent software developer who also creates web and
                        mobile business applications such as invoicing, point-of-sale and fee-management tools. Working with real
                        documents and billing workflows every day is what inspired these tools: merging invoices, numbering reports,
                        marking drafts and turning scans into clean PDFs.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        You can reach us at any time through the <Link href="/contact" className="text-blue-600 underline">contact page</Link> or
                        send ideas and bug reports through the <Link href="/feedback" className="text-blue-600 underline">feedback page</Link>.
                    </p>
                </section>

                <section aria-labelledby="principles-heading" className="space-y-5">
                    <h2 id="principles-heading" className="text-2xl font-bold text-gray-900">What we stand for</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {PRINCIPLES.map((p) => (
                            <div key={p.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <p.icon className="w-7 h-7 text-blue-600 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{p.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">How the tools work</h2>
                    <p className="text-gray-700 leading-relaxed">
                        When you select a file, your browser reads it into memory. Open-source JavaScript libraries, such as pdf-lib for
                        editing PDF structure and PDF.js for drawing page previews, do the work inside the page. The finished file is
                        created in your browser and offered as a normal download. You can read the details and learn how to verify this
                        yourself on the <Link href="/features#privacy" className="text-blue-600 underline">features page</Link>.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Because your device does the work, very large files depend on your device’s memory. We explain these limits openly in
                        the <Link href="/faq" className="text-blue-600 underline">FAQ</Link>.
                    </p>
                </section>

                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Our tools</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {TOOLS.map((t) => (
                            <li key={t.id}>
                                <Link href={t.href} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition">
                                    <t.icon className={`w-6 h-6 shrink-0 ${t.iconColor}`} />
                                    <span>
                                        <span className="block font-semibold text-gray-900 text-sm">{t.title}</span>
                                        <span className="block text-xs text-gray-600 mt-0.5 leading-relaxed">{t.short}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">How the site is funded</h2>
                    <p className="text-gray-700 leading-relaxed">
                        The tools are free to use. The site is supported by advertising and by voluntary contributions from people who
                        find it useful. Ads are shown by third-party advertising services and are separate from the PDF tools. They do not
                        receive the contents of your files. See the <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link> for
                        details on cookies and your choices.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        If you want to help, visit the <Link href="/support-project" className="text-blue-600 underline">Support the project</Link> page.
                    </p>
                </section>

                <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-10 text-center text-white shadow-xl">
                    <h2 className="text-2xl font-extrabold mb-2">Have an idea or found a problem?</h2>
                    <p className="text-blue-100 text-sm max-w-xl mx-auto mb-6">
                        We read every message. Tell us what would make the tools better.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/feedback" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold py-3 px-7 rounded-xl hover:bg-blue-50">
                            Send feedback <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/contact" className="inline-flex items-center justify-center bg-blue-700/60 text-white font-semibold py-3 px-7 rounded-xl hover:bg-blue-700">
                            Contact us
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}