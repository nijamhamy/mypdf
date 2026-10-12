import type { Metadata } from "next";
import type { ElementType } from "react";
import Link from "next/link";
import {
    HelpCircle, ArrowRight, CheckCircle2, ShieldCheck, Lock, FileCheck, BookOpen,
    ListChecks, Wrench, Scale, Users, Layers, Compass, Info, LayoutGrid, Sparkles, UserCheck,
} from "lucide-react";
import {
    CORE_FEATURES, CHOOSER, TOOLS, GUIDES, USE_CASES, LIMITS, COMPARISON, TROUBLESHOOTING,
    PRIVACY_POINTS, SUPPORTED, FAQS, GLOSSARY, TOC,
} from "./content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
    title: "Features, Guides & Help Center | mypdf.site",
    description:
        "Learn how mypdf.site merges, splits, rotates, compresses, watermarks, numbers, edits and converts PDFs, makes printable photo sheets, and runs PDF to Word with OCR, all inside your browser. Step-by-step guides, privacy details, limits, FAQ and troubleshooting.",
    alternates: { canonical: "/features" },
};

const sectionCls = "bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm scroll-mt-24";

function SectionTitle({
    icon: Icon, title, sub, tone = "blue",
}: { icon: ElementType; title: string; sub?: string; tone?: "blue" | "green" | "amber" | "violet" }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        amber: "bg-amber-50 text-amber-700",
        violet: "bg-violet-50 text-violet-700",
    } as const;
    return (
        <div className="mb-8 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h2>
            </div>
            {sub && <p className="mt-3 max-w-3xl leading-relaxed text-gray-700">{sub}</p>}
        </div>
    );
}

export default function FeaturesPage() {
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
            />
            <div className="mx-auto max-w-6xl space-y-14">
                <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 p-8 text-center text-white shadow-xl sm:p-14">
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                    <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
                    <div className="relative mx-auto max-w-3xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Features &amp; Help Center
                        </span>
                        <h1 className="mb-4 mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Why choose mypdf.site?</h1>
                        <p className="text-lg leading-relaxed text-blue-50">
                            A set of PDF and image tools that run in your browser. Merge, split, rotate, compress, watermark, number and edit
                            PDFs, convert a PDF to Word (with OCR for scans), turn images into PDFs, or lay out several copies of a photo on one
                            printable sheet, without uploading your documents to our server for processing.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <a href="#overview" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 font-bold text-blue-800 shadow-md transition-all hover:bg-blue-50">
                                See all tools <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </a>
                            <a href="#choose" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3 font-semibold text-white transition-all hover:bg-white/20">
                                Which tool do I need?
                            </a>
                        </div>
                    </div>
                </header>

                <div className="relative -mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { v: String(TOOLS.length), l: "tools in one place" },
                        { v: "0", l: "of your files uploaded for processing" },
                        { v: "No", l: "sign-up or account needed" },
                        { v: "Free", l: "to use, with no page limits from us" },
                    ].map((s) => (
                        <div key={s.l} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
                            <p className="text-3xl font-extrabold text-blue-700">{s.v}</p>
                            <p className="mt-1 text-xs text-gray-700 sm:text-sm">{s.l}</p>
                        </div>
                    ))}
                </div>

                <nav aria-label="On this page" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-700">On this page</p>
                    <ul className="flex flex-wrap gap-2">
                        {TOC.map((t) => (
                            <li key={t.id}>
                                <a href={`#${t.id}`} className="inline-block rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-800 hover:bg-blue-100">
                                    {t.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section id="why" className="scroll-mt-24" aria-label="Core features">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {CORE_FEATURES.map((f) => (
                            <article key={f.title} className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} ${f.fg}`}>
                                    <f.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-gray-900">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-700">{f.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="overview" className={sectionCls}>
                    <SectionTitle
                        icon={LayoutGrid}
                        title="Tools at a glance"
                        sub={`All ${TOOLS.length} tools in one list. Open any card to use the tool, or scroll down for full details, guides and limits.`}
                        tone="violet"
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {TOOLS.map((t) => (
                            <Link
                                key={t.name}
                                href={t.href}
                                className="group flex items-start gap-4 rounded-2xl border border-gray-200 p-5 transition-all hover:border-blue-300 hover:shadow-md"
                            >
                                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.fg}`}>
                                    <t.icon className="h-6 w-6" aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-bold text-gray-900 group-hover:text-blue-800">{t.name}</span>
                                    <span className="mt-0.5 block text-sm leading-snug text-gray-700">{t.tagline}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section id="choose" className={sectionCls}>
                    <SectionTitle
                        icon={Compass}
                        title="Which tool do I need?"
                        sub="Start from what you want to achieve. Each row points to the tool that does it best, with a note on what to expect."
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 text-left text-sm">
                            <caption className="sr-only">Which tool to use for each goal</caption>
                            <thead className="bg-gray-50 text-gray-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-semibold">I want to…</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Use</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Good to know</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CHOOSER.map((c) => (
                                    <tr key={c.goal} className="border-t border-gray-200 hover:bg-blue-50/40">
                                        <th scope="row" className="px-4 py-3 text-left font-medium text-gray-900">{c.goal}</th>
                                        <td className="px-4 py-3">
                                            <Link href={c.href} className="whitespace-nowrap font-semibold text-blue-700 hover:underline">{c.tool}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{c.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                <div className="mb-4 flex items-center gap-4">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.fg}`}>
                                        <t.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
                                        <p className="text-sm text-gray-700">{t.tagline}</p>
                                    </div>
                                </div>
                                <p className="mb-5 leading-relaxed text-gray-800">{t.description}</p>
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div>
                                        <h4 className="mb-2 text-sm font-bold text-gray-900">Main features</h4>
                                        <ul className="space-y-2">
                                            {t.features.map((f) => (
                                                <li key={f} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
                                            <h4 className="mb-1 text-sm font-bold text-gray-900">Best for</h4>
                                            <p className="text-sm leading-relaxed text-gray-800">{t.bestFor}</p>
                                        </div>
                                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                                            <h4 className="mb-1 text-sm font-bold text-gray-900">Good to know</h4>
                                            <p className="text-sm leading-relaxed text-gray-800">{t.limits}</p>
                                        </div>
                                    </div>
                                </div>
                                <Link href={t.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
                                    Open {t.name} <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
                    <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                            { n: 1, t: "You choose a file", d: "When you select or drop a file, your browser gives the page access to that single file. It is read into memory on your device. It is not sent to our server." },
                            { n: 2, t: "Your browser does the work", d: "Open-source JavaScript libraries read the structure of the PDF, copy, rotate or draw on pages, extract text, lay out sheets, and build a new document. Page previews are drawn by a PDF rendering engine in the same tab." },
                            { n: 3, t: "You download the result", d: "The finished file is created as a temporary object in your browser and handed to you as a normal download. Closing the tab discards it." },
                        ].map((s) => (
                            <li key={s.n} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-bold text-white">{s.n}</span>
                                <h3 className="mb-2 font-bold text-gray-900">{s.t}</h3>
                                <p className="text-sm leading-relaxed text-gray-700">{s.d}</p>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full overflow-hidden rounded-xl border border-gray-200 text-left text-sm">
                            <caption className="mb-2 text-left text-sm font-semibold text-gray-900">Supported formats by tool</caption>
                            <thead className="bg-gray-50 text-gray-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-semibold">Tool</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">You provide</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">You receive</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUPPORTED.map((r) => (
                                    <tr key={r.tool} className="border-t border-gray-200">
                                        <th scope="row" className="px-4 py-3 text-left font-medium text-gray-900">{r.tool}</th>
                                        <td className="px-4 py-3 text-gray-700">{r.input}</td>
                                        <td className="px-4 py-3 text-gray-700">{r.output}</td>
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
                            <article key={g.id} id={g.id} className="scroll-mt-24 rounded-2xl border border-gray-200 p-6 sm:p-8">
                                <h3 className="mb-2 text-xl font-bold text-gray-900">{g.title}</h3>
                                <p className="mb-5 text-sm leading-relaxed text-gray-700">{g.intro}</p>
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div>
                                        <h4 className="mb-3 text-sm font-bold text-gray-900">Steps</h4>
                                        <ol className="space-y-3">
                                            {g.steps.map((s, i) => (
                                                <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-800">
                                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{i + 1}</span>
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div>
                                        <h4 className="mb-3 text-sm font-bold text-gray-900">Tips</h4>
                                        <ul className="space-y-2">
                                            {g.tips.map((t) => (
                                                <li key={t} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                                                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                                                    <span>{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <Link href={g.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
                                    Try it now <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
                        tone="violet"
                    />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {USE_CASES.map((u) => (
                            <article key={u.title} className="rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-md">
                                <u.icon className="mb-3 h-7 w-7 text-blue-700" aria-hidden="true" />
                                <h3 className="mb-2 font-bold text-gray-900">{u.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-700">{u.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="privacy" className={sectionCls}>
                    <SectionTitle
                        icon={ShieldCheck}
                        title="Privacy and security"
                        sub="Documents often contain contracts, IDs and financial details. Here is how the tools treat them."
                        tone="green"
                    />
                    <ul className="mb-8 space-y-3">
                        {PRIVACY_POINTS.map((p) => (
                            <li key={p} className="flex gap-3 leading-relaxed text-gray-800">
                                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                        <h3 className="mb-2 flex items-center gap-2 font-bold text-gray-900">
                            <FileCheck className="h-5 w-5 text-blue-700" aria-hidden="true" /> Check it yourself in one minute
                        </h3>
                        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-gray-800">
                            <li>Open any tool on this site.</li>
                            <li>Press F12 to open developer tools and select the Network tab.</li>
                            <li>Choose a file and run the tool.</li>
                            <li>Look at the requests. You should not see your file being uploaded.</li>
                        </ol>
                        <p className="mt-3 text-sm leading-relaxed text-gray-800">
                            You may still see requests for page assets, analytics or advertising, and for OCR language data when you use OCR for the
                            first time. These do not contain your document.
                        </p>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-gray-700">
                        Read the full details in the <Link href="/privacy" className="text-blue-700 underline">Privacy Policy</Link>.
                    </p>
                </section>

                <section id="limits" className={sectionCls}>
                    <SectionTitle
                        icon={Info}
                        title="What these tools can and cannot do"
                        sub="No browser tool can do everything. Knowing the limits up front saves time and helps you pick the right option."
                        tone="amber"
                    />
                    <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {LIMITS.map((l) => (
                            <div key={l.area} className="rounded-xl border border-gray-200 p-5">
                                <dt className="font-semibold text-gray-900">{l.area}</dt>
                                <dd className="mt-1 text-sm leading-relaxed text-gray-700">{l.text}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section id="comparison" className={sectionCls}>
                    <SectionTitle
                        icon={Scale}
                        title="Browser tools compared with other options"
                        sub="A fair comparison of three common ways to work with PDFs, so you can pick the right one for the job."
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 text-left text-sm">
                            <caption className="sr-only">Comparison of browser tools with other ways to work with PDFs</caption>
                            <thead className="bg-gray-50 text-gray-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-semibold">Feature</th>
                                    {COMPARISON.columns.map((c) => (
                                        <th scope="col" key={c} className="px-4 py-3 font-semibold">{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.rows.map((r) => (
                                    <tr key={r.label} className="border-t border-gray-200">
                                        <th scope="row" className="px-4 py-3 text-left font-medium text-gray-900">{r.label}</th>
                                        {r.values.map((v, i) => (
                                            <td key={i} className="px-4 py-3 text-gray-700">{v}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-gray-700">
                        Browser tools are ideal for quick, private jobs. If you regularly rewrite whole paragraphs inside PDFs, fill in complex
                        forms or manage thousands of files, dedicated desktop software is the better fit.
                    </p>
                </section>

                <section id="troubleshooting" className={sectionCls}>
                    <SectionTitle
                        icon={Wrench}
                        title="Troubleshooting common problems"
                        sub="Most issues come from very large files, protected files, older font encodings, print scaling or limited device memory. These fixes solve the majority."
                        tone="amber"
                    />
                    <dl className="space-y-5">
                        {TROUBLESHOOTING.map((t) => (
                            <div key={t.problem} className="rounded-xl border border-gray-200 p-5">
                                <dt className="font-semibold text-gray-900">{t.problem}</dt>
                                <dd className="mt-1 text-sm leading-relaxed text-gray-700">{t.fix}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section id="faq" className={sectionCls}>
                    <SectionTitle icon={HelpCircle} title="Frequently asked questions" />
                    <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200">
                        {FAQS.map((f) => (
                            <details key={f.q} className="group bg-white open:bg-gray-50">
                                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-gray-900">
                                    <span className="flex gap-2">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                                        {f.q}
                                    </span>
                                    <span className="text-xl leading-none text-gray-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                                </summary>
                                <p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-gray-700">{f.a}</p>
                            </details>
                        ))}
                    </div>
                    <p className="mt-5 text-sm text-gray-700">
                        Still need help? Visit the <Link href="/faq" className="text-blue-700 underline">FAQ page</Link> or{" "}
                        <Link href="/contact" className="text-blue-700 underline">contact us</Link>.
                    </p>
                </section>

                <section id="glossary" className={sectionCls}>
                    <SectionTitle
                        icon={BookOpen}
                        title="Glossary of PDF terms"
                        sub="Plain-language meanings for the words you will meet in the tools."
                    />
                    <dl className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
                        {GLOSSARY.map((g) => (
                            <div key={g.term}>
                                <dt className="font-semibold text-gray-900">{g.term}</dt>
                                <dd className="text-sm leading-relaxed text-gray-700">{g.def}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="flex flex-col items-start gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:p-8">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <UserCheck className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">About this help center</h2>
                        <p className="mt-1 text-sm leading-relaxed text-gray-700">
                            This page is written and maintained by the mypdf.site team and is updated when a tool changes. It describes what each
                            tool does, including its limits, so you can decide before you start. Learn more{" "}
                            <Link href="/about" className="text-blue-700 underline">about the project</Link>, or{" "}
                            <Link href="/contact" className="text-blue-700 underline">tell us</Link> if something here is wrong or unclear.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-center text-white shadow-xl sm:p-12">
                    <h2 className="mb-4 text-3xl font-extrabold">Ready to manage your documents?</h2>
                    <p className="mx-auto mb-8 max-w-xl text-sm text-blue-50 sm:text-base">
                        Go back to the homepage and start merging, editing, converting, compressing or laying out your files.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-blue-800 shadow-md transition-all hover:bg-blue-50"
                    >
                        <span>Explore all tools</span>
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                </section>

                <p className="text-center text-xs text-gray-700">
                    Last updated {SITE.lastUpdated}. Questions or corrections? <Link href="/contact" className="underline">Contact us</Link>.
                </p>
            </div>
        </main>
    );
}
