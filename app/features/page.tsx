import type { Metadata } from 'next';
import Link from 'next/link';
import {
    HelpCircle, ArrowRight, CheckCircle2, ShieldCheck, Lock, FileCheck, BookOpen,
    ListChecks, Wrench, Scale, Users, Layers,
} from 'lucide-react';
import {
    CORE_FEATURES, TOOLS, GUIDES, USE_CASES, COMPARISON, TROUBLESHOOTING,
    PRIVACY_POINTS, SUPPORTED, FAQS, GLOSSARY, TOC,
} from './content';

export const metadata: Metadata = {
    title: 'Features, Guides & Help Center | mypdf.site',
    description:
        'Learn how mypdf.site merges, splits, rotates, watermarks and numbers PDFs, and converts images to PDF and back, all inside your browser. Step-by-step guides, privacy details, FAQ and troubleshooting.',
    alternates: { canonical: '/features' },
};

const sectionCls = 'bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm scroll-mt-24';

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
    return (
        <div className="border-b border-gray-100 pb-5 mb-8">
            <div className="flex items-center gap-3">
                <Icon className="w-7 h-7 text-blue-600 shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
            </div>
            {sub && <p className="text-gray-600 mt-3 leading-relaxed max-w-3xl">{sub}</p>}
        </div>
    );
}

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-14">

                <header className="text-center max-w-3xl mx-auto">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold uppercase px-3 py-1 rounded-full tracking-wider">
                        Features &amp; Help Center
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-4 mb-4">
                        Why choose mypdf.site?
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        A set of PDF tools that run entirely in your browser. Merge, split, rotate, watermark
                        and number PDFs, or convert images to PDF and back, without uploading your documents anywhere.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
                        <span className="px-4 py-2 bg-white border border-gray-200 rounded-full font-medium text-gray-700">{TOOLS.length} tools</span>
                        <span className="px-4 py-2 bg-white border border-gray-200 rounded-full font-medium text-gray-700">No file uploads</span>
                        <span className="px-4 py-2 bg-white border border-gray-200 rounded-full font-medium text-gray-700">No sign-up</span>
                        <span className="px-4 py-2 bg-white border border-gray-200 rounded-full font-medium text-gray-700">Free to use</span>
                    </div>
                </header>

                <nav aria-label="On this page" className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">On this page</p>
                    <ul className="flex flex-wrap gap-2">
                        {TOC.map((t) => (
                            <li key={t.id}>
                                <a href={`#${t.id}`} className="inline-block px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg">
                                    {t.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section id="why" className="scroll-mt-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CORE_FEATURES.map((f) => (
                            <article key={f.title} className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 ${f.bg} ${f.fg} rounded-xl flex items-center justify-center mb-5`}>
                                    <f.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{f.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="tools" className={sectionCls}>
                    <SectionTitle
                        icon={Wrench}
                        title="Every tool and what it can do"
                        sub="Each tool is built for real document work. Here is what you can do with each one, who it suits, and what to keep in mind."
                    />
                    <div className="space-y-8">
                        {TOOLS.map((t) => (
                            <article key={t.name} className="rounded-2xl border border-gray-200 p-6 sm:p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 ${t.bg} ${t.fg} rounded-xl flex items-center justify-center shrink-0`}>
                                        <t.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
                                        <p className="text-sm text-gray-500">{t.tagline}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-5">{t.description}</p>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-2">Main features</h4>
                                        <ul className="space-y-2">
                                            {t.features.map((f) => (
                                                <li key={f} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-1">Best for</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">{t.bestFor}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-1">Good to know</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">{t.limits}</p>
                                        </div>
                                    </div>
                                </div>
                                <Link href={t.href} className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-blue-600 hover:text-blue-800">
                                    Open {t.name} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className={sectionCls}>
                    <SectionTitle
                        icon={Layers}
                        title="How the tools work"
                        sub="Understanding what happens to your file helps you trust the result and explains the few limits you may notice."
                    />
                    <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { n: 1, t: 'You choose a file', d: 'When you select or drop a PDF, your browser gives the page access to that single file. The file is read into memory on your device. It is not sent anywhere.' },
                            { n: 2, t: 'Your browser does the work', d: 'Open-source JavaScript libraries read the structure of the PDF, copy, rotate or draw on pages, and build a new document. Page previews are drawn by a PDF rendering engine in the same tab.' },
                            { n: 3, t: 'You download the result', d: 'The finished file is created as a temporary object in your browser and handed to you as a normal download. Closing the tab discards it.' },
                        ].map((s) => (
                            <li key={s.n} className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
                                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold mb-3">{s.n}</span>
                                <h3 className="font-bold text-gray-900 mb-2">{s.t}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{s.d}</p>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full text-sm text-left border border-gray-200 rounded-xl overflow-hidden">
                            <caption className="text-left text-sm font-semibold text-gray-900 mb-2">Supported formats by tool</caption>
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Tool</th>
                                    <th className="px-4 py-3 font-semibold">You provide</th>
                                    <th className="px-4 py-3 font-semibold">You receive</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUPPORTED.map((r) => (
                                    <tr key={r.tool} className="border-t border-gray-200">
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.tool}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.input}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.output}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="guides" className={sectionCls}>
                    <SectionTitle
                        icon={BookOpen}
                        title="Step-by-step guides"
                        sub="Short, practical walkthroughs for the jobs people do most often, with tips learned from common mistakes."
                    />
                    <div className="space-y-6">
                        {GUIDES.map((g) => (
                            <article key={g.id} id={g.id} className="rounded-2xl border border-gray-200 p-6 sm:p-8 scroll-mt-24">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{g.title}</h3>
                                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{g.intro}</p>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-3">Steps</h4>
                                        <ol className="space-y-3">
                                            {g.steps.map((s, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-3">Tips</h4>
                                        <ul className="space-y-2">
                                            {g.tips.map((t) => (
                                                <li key={t} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                                                    <ListChecks className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                    <span>{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <Link href={g.href} className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                                    Try it now <ArrowRight className="w-4 h-4" />
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="use-cases" className={sectionCls}>
                    <SectionTitle
                        icon={Users}
                        title="Who uses these tools"
                        sub="Everyday examples of how different people use the same set of tools."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {USE_CASES.map((u) => (
                            <article key={u.title} className="rounded-2xl border border-gray-200 p-6">
                                <u.icon className="w-7 h-7 text-blue-600 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">{u.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{u.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="privacy" className={sectionCls}>
                    <SectionTitle
                        icon={ShieldCheck}
                        title="Privacy and security"
                        sub="Documents often contain contracts, IDs and financial details. Here is exactly how they are treated."
                    />
                    <ul className="space-y-3 mb-8">
                        {PRIVACY_POINTS.map((p) => (
                            <li key={p} className="flex gap-3 text-gray-700 leading-relaxed">
                                <Lock className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-blue-600" /> Check it yourself in one minute
                        </h3>
                        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 leading-relaxed">
                            <li>Open any tool on this site.</li>
                            <li>Press F12 to open developer tools and select the Network tab.</li>
                            <li>Choose a PDF and run the tool.</li>
                            <li>Look at the requests. You will not see your file being uploaded.</li>
                        </ol>
                    </div>
                    <p className="text-sm text-gray-600 mt-5 leading-relaxed">
                        Read the full details in the <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
                    </p>
                </section>

                <section id="comparison" className={sectionCls}>
                    <SectionTitle
                        icon={Scale}
                        title="Browser tools compared with other options"
                        sub="A fair comparison of three common ways to work with PDFs, so you can pick the right one for the job."
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border border-gray-200">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Feature</th>
                                    {COMPARISON.columns.map((c) => (
                                        <th key={c} className="px-4 py-3 font-semibold">{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.rows.map((r) => (
                                    <tr key={r.label} className="border-t border-gray-200">
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.label}</td>
                                        {r.values.map((v, i) => (
                                            <td key={i} className="px-4 py-3 text-gray-600">{v}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-5 leading-relaxed">
                        Browser tools are ideal for quick, private jobs. If you regularly edit the text inside PDFs, fill in
                        complex forms or manage thousands of files, dedicated desktop software is the better fit.
                    </p>
                </section>

                <section id="troubleshooting" className={sectionCls}>
                    <SectionTitle
                        icon={Wrench}
                        title="Troubleshooting common problems"
                        sub="Most issues come from very large files, protected files or limited device memory. These fixes solve the majority."
                    />
                    <dl className="space-y-5">
                        {TROUBLESHOOTING.map((t) => (
                            <div key={t.problem} className="rounded-xl border border-gray-200 p-5">
                                <dt className="font-semibold text-gray-900">{t.problem}</dt>
                                <dd className="text-sm text-gray-600 mt-1 leading-relaxed">{t.fix}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section id="faq" className={sectionCls}>
                    <SectionTitle icon={HelpCircle} title="Frequently asked questions" />
                    <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
                        {FAQS.map((f) => (
                            <details key={f.q} className="group bg-white open:bg-gray-50">
                                <summary className="cursor-pointer list-none px-5 py-4 flex items-start justify-between gap-4 font-semibold text-gray-900">
                                    <span className="flex gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        {f.q}
                                    </span>
                                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                                </summary>
                                <p className="px-5 pb-5 pl-12 text-sm text-gray-600 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-5">
                        Still need help? Visit the <Link href="/faq" className="text-blue-600 underline">FAQ page</Link> or{' '}
                        <Link href="/contact" className="text-blue-600 underline">contact us</Link>.
                    </p>
                </section>

                <section id="glossary" className={sectionCls}>
                    <SectionTitle
                        icon={BookOpen}
                        title="Glossary of PDF terms"
                        sub="Plain-language meanings for the words you will meet in the tools."
                    />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                        {GLOSSARY.map((g) => (
                            <div key={g.term}>
                                <dt className="font-semibold text-gray-900">{g.term}</dt>
                                <dd className="text-sm text-gray-600 leading-relaxed">{g.def}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl">
                    <h2 className="text-3xl font-extrabold mb-4">Ready to manage your documents?</h2>
                    <p className="text-blue-100 max-w-xl mx-auto mb-8 text-sm sm:text-base">
                        Go back to the homepage and start merging, splitting, rotating or converting your PDF files right now.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold py-3 px-8 rounded-xl shadow-md hover:bg-blue-50 transition-all"
                    >
                        <span>Explore all tools</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </section>

                <p className="text-center text-xs text-gray-500">
                    Last updated October 2026. Questions or corrections? <Link href="/contact" className="underline">Contact us</Link>.
                </p>
            </div>
        </main>
    );
}