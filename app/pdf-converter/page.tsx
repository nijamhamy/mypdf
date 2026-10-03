import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, ShieldCheck, Zap, MousePointerClick } from 'lucide-react';
import ToolsExplorer from './ToolsExplorer';
import { TOOLS } from '@/lib/tools';

export const metadata: Metadata = {
    title: 'PDF Converter Hub & All PDF Tools | mypdf.site',
    description:
        'Convert PDF to JPG and JPG to PDF, then merge, split, rotate, watermark, number and compress PDFs. Every tool runs in your browser and your files are never uploaded.',
    alternates: { canonical: '/pdf-converter' },
};

const converters = TOOLS.filter((t) => t.category === 'convert');

const BENEFITS = [
    { icon: ShieldCheck, title: 'Files stay on your device', text: 'Processing happens in your browser, so your documents are not uploaded for conversion.' },
    { icon: Zap, title: 'No waiting in queues', text: 'Work starts when you click, so speed depends on your own device instead of an upload.' },
    { icon: MousePointerClick, title: 'No sign-up, no install', text: 'Open a tool in any modern browser on your computer, tablet or phone.' },
];

export default function PDFConverterPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-16">

                <header className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                        PDF Converter Hub
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        Convert PDFs to images and images to PDFs, then use every other PDF tool from one place. Everything runs in your browser.
                    </p>
                </header>

                <section aria-labelledby="converters-heading" className="space-y-6">
                    <h2 id="converters-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Converters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {converters.map((t) => {
                            const isPdfSource = t.id === 'pdf-to-jpg';
                            return (
                                <Link
                                    key={t.id}
                                    href={t.href}
                                    className={`group p-8 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${t.cardBg}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold text-gray-800 shadow-sm">
                                                {isPdfSource ? 'PDF' : 'JPG · PNG · WebP'}
                                            </span>
                                            <ArrowRightLeft className="w-5 h-5 text-gray-500 rotate-0" aria-hidden="true" />
                                            <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold text-gray-800 shadow-sm">
                                                {isPdfSource ? 'JPG · PNG · WebP' : 'PDF'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <t.icon className={`w-8 h-8 ${t.iconColor}`} />
                                            <h3 className="text-2xl font-bold text-gray-900">{t.title}</h3>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed mb-4">{t.short}</p>
                                        <ul className="space-y-1.5 text-sm text-gray-700 list-disc pl-5">
                                            {t.points.map((p) => <li key={p}>{p}</li>)}
                                        </ul>
                                    </div>
                                    <div className="mt-8 flex items-center text-sm font-semibold text-blue-600">
                                        <span>Get started</span>
                                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <ToolsExplorer />

                <section aria-labelledby="why-heading" className="space-y-6">
                    <h2 id="why-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Why use these tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {BENEFITS.map((b) => (
                            <div key={b.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <b.icon className="w-7 h-7 text-blue-600 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{b.text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                        Want to know more? Read the <Link href="/features" className="text-blue-600 underline">guides</Link> or the{' '}
                        <Link href="/faq" className="text-blue-600 underline">FAQ</Link>.
                    </p>
                </section>
            </div>
        </main>
    );
}