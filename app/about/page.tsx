import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, Heart, ShieldCheck, Wrench } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
    title: "About Us | mypdf.site",
    description:
        "Learn who is behind mypdf.site, why it was built, how the browser-based PDF tools work, and how the site is funded.",
    alternates: { canonical: "/about" },
};

const PRINCIPLES = [
    { icon: ShieldCheck, title: "Privacy first", text: "Your documents are processed in your own browser. We designed the tools so that we do not need to receive your files." },
    { icon: Eye, title: "Honest and transparent", text: "We explain how the tools work, what their limits are, and how the site earns money. No hidden fees and no sign-up walls." },
    { icon: Wrench, title: "Useful, not minimal", text: "A simple tool should still give you control: choose pages, order, size and quality, and see a preview before you commit." },
    { icon: Heart, title: "Built to last", text: "We improve the tools based on feedback and look into the problems that people report." },
];

const card = "space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-12">
                <header className="text-center">
                    <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">About {SITE.name}</h1>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-700">
                        {SITE.name} is a free set of PDF tools that run in your web browser. We built it so that everyday document jobs
                        are quick, private and easy for everyone.
                    </p>
                </header>

                <section className={card} aria-labelledby="why-heading">
                    <h2 id="why-heading" className="text-2xl font-bold text-gray-900">Why we built this</h2>
                    <p className="leading-relaxed text-gray-800">
                        Many online PDF services ask you to upload your documents to a remote server, wait in a queue, and sign up before
                        you can download the result. For contracts, invoices, ID cards and statements, that is not a comfortable trade.
                    </p>
                    <p className="leading-relaxed text-gray-800">
                        {SITE.name} takes a different approach. The work happens on your own device using modern browser technology.
                        You choose a file, set your options, and download the result. Nothing needs to be uploaded to our server for processing.
                    </p>
                </section>

                <section className={card} aria-labelledby="who-heading">
                    <h2 id="who-heading" className="text-2xl font-bold text-gray-900">Who is behind the site</h2>
                    <p className="leading-relaxed text-gray-800">
                        {SITE.name} is operated by {SITE.owner}, an independent software developer who also creates web and mobile business
                        applications such as invoicing, point-of-sale and fee-management tools. Working with real documents and billing
                        workflows is what inspired these tools: merging invoices, numbering reports, marking drafts and turning scans into
                        clean PDFs.
                    </p>
                    <p className="leading-relaxed text-gray-800">
                        You can reach us at <a href={`mailto:${SITE.email}`} className="text-blue-700 underline">{SITE.email}</a>, through the{" "}
                        <Link href="/contact" className="text-blue-700 underline">contact page</Link>, or send ideas and bug reports through the{" "}
                        <Link href="/feedback" className="text-blue-700 underline">feedback page</Link>.
                    </p>
                </section>

                <section aria-labelledby="principles-heading" className="space-y-5">
                    <h2 id="principles-heading" className="text-2xl font-bold text-gray-900">What we stand for</h2>
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {PRINCIPLES.map((p) => (
                            <li key={p.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <p.icon className="mb-3 h-7 w-7 text-blue-700" aria-hidden="true" />
                                <h3 className="mb-1 font-bold text-gray-900">{p.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-700">{p.text}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className={card} aria-labelledby="how-heading">
                    <h2 id="how-heading" className="text-2xl font-bold text-gray-900">How the tools work</h2>
                    <p className="leading-relaxed text-gray-800">
                        When you select a file, your browser reads it into memory. Open-source JavaScript libraries, such as pdf-lib for
                        editing PDF structure and PDF.js for drawing page previews, do the work inside the page. The finished file is
                        created in your browser and offered as a normal download. You can read the details and learn how to verify this
                        yourself on the <Link href="/features#privacy" className="text-blue-700 underline">features page</Link>.
                    </p>
                    <p className="leading-relaxed text-gray-800">
                        Because your device does the work, very large files depend on your device&apos;s memory. We explain these limits in
                        the <Link href="/faq" className="text-blue-700 underline">FAQ</Link>.
                    </p>
                </section>

                <section className={card} aria-labelledby="tools-heading">
                    <h2 id="tools-heading" className="text-2xl font-bold text-gray-900">Our tools</h2>
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {TOOLS.map((t) => (
                            <li key={t.id}>
                                <Link href={t.href} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-sm">
                                    <t.icon className={`h-6 w-6 shrink-0 ${t.iconColor}`} aria-hidden="true" />
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-900">{t.title}</span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-700">{t.short}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className={card} aria-labelledby="funding-heading">
                    <h2 id="funding-heading" className="text-2xl font-bold text-gray-900">How the site is funded</h2>
                    <p className="leading-relaxed text-gray-800">
                        The tools are free to use. The site is supported by advertising and by voluntary contributions from people who
                        find it useful. Ads are shown by third-party advertising services and are separate from the PDF tools. They do not
                        receive the contents of your files. See the <Link href="/privacy" className="text-blue-700 underline">Privacy Policy</Link> for
                        details on cookies and your choices.
                    </p>
                    <p className="leading-relaxed text-gray-800">
                        If you want to help, visit the <Link href="/support-project" className="text-blue-700 underline">Support the project</Link> page.
                    </p>
                </section>

                <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-center text-white shadow-xl sm:p-10" aria-labelledby="cta-heading">
                    <h2 id="cta-heading" className="mb-2 text-2xl font-extrabold">Have an idea or found a problem?</h2>
                    <p className="mx-auto mb-6 max-w-xl text-sm text-blue-50">
                        Tell us what would make the tools better. We use feedback to decide what to improve.
                    </p>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/feedback" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 font-bold text-blue-800 hover:bg-blue-50">
                            Send feedback <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-blue-900/60 px-7 py-3 font-semibold text-white hover:bg-blue-900">
                            Contact us
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
