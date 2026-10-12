import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowRightLeft, MousePointerClick, ShieldCheck, Zap } from "lucide-react";
import ToolsExplorer from "./ToolsExplorer";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
    title: "PDF Converter Hub & All PDF Tools | mypdf.site",
    description:
        "Start with popular PDF tools, then convert PDF to JPG and JPG to PDF, merge, split, rotate, watermark, number and compress PDFs. Tools run in your browser and files are not uploaded for processing.",
    alternates: { canonical: "/pdf-converter" },
};

// Editorial list of tools to show first. Edit this array to change the order.
// IDs that do not exist in TOOLS are ignored automatically.
const POPULAR_TOOL_IDS = [
    "pdf-to-jpg",
    "jpg-to-pdf",
    "merge-pdf",
    "split-pdf",
    "compress-pdf",
    "pdf-to-word",
];
const POPULAR_LIMIT = 6;

const popularTools = (() => {
    const byId = new Map(TOOLS.map((tool) => [tool.id, tool]));
    const picked = POPULAR_TOOL_IDS.map((id) => byId.get(id)).filter(
        (tool): tool is (typeof TOOLS)[number] => Boolean(tool)
    );
    if (picked.length >= POPULAR_LIMIT) return picked.slice(0, POPULAR_LIMIT);
    const used = new Set(picked.map((tool) => tool.id));
    const fillers = TOOLS.filter((tool) => !used.has(tool.id)).slice(0, POPULAR_LIMIT - picked.length);
    return [...picked, ...fillers];
})();

const converters = TOOLS.filter((tool) => tool.category === "convert");

const BENEFITS = [
    {
        icon: ShieldCheck,
        title: "Files stay on your device",
        text: "Processing happens in your browser, so your documents are not uploaded to our server for conversion.",
    },
    {
        icon: Zap,
        title: "No upload queue",
        text: "Work starts when you click. Speed depends on your device, file size and the options you choose.",
    },
    {
        icon: MousePointerClick,
        title: "No sign-up, no install",
        text: "Open a tool in a modern browser on your computer, tablet or phone.",
    },
];

export default function PDFConverterPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-16">
                <header className="text-center">
                    <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                        PDF Converter Hub
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-700 sm:text-xl">
                        Start with the most-used PDF tools, convert PDFs to images and images to PDFs, or browse every tool below.
                        Processing runs in your browser.
                    </p>
                </header>

                <section aria-labelledby="popular-heading" className="space-y-6">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h2 id="popular-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                Popular PDF tools
                            </h2>
                            <p className="mt-1 text-sm text-gray-700">Quick access to common tasks. Open a tool to see its options and limits.</p>
                        </div>
                        <a href="#all-tools" className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline">
                            Browse all tools
                        </a>
                    </div>

                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {popularTools.map((tool, index) => (
                            <li key={tool.id}>
                                <Link
                                    href={tool.href}
                                    className={`group flex h-full flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tool.cardBg}`}
                                >
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <tool.icon className={`h-8 w-8 ${tool.iconColor}`} aria-hidden="true" />
                                            {index < 3 && (
                                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="mb-2 text-xl font-bold text-gray-900">{tool.title}</h3>
                                        <p className="text-sm leading-relaxed text-gray-700">{tool.short}</p>
                                    </div>
                                    <div className="mt-6 flex items-center text-sm font-semibold text-blue-700">
                                        <span>Open tool</span>
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="converters-heading" className="space-y-6">
                    <h2 id="converters-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Converters
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {converters.map((tool) => {
                            const isPdfSource = tool.id === "pdf-to-jpg";
                            return (
                                <Link
                                    key={tool.id}
                                    href={tool.href}
                                    className={`group flex flex-col justify-between rounded-3xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tool.cardBg}`}
                                >
                                    <div>
                                        <div className="mb-6 flex items-center gap-3">
                                            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-gray-800 shadow-sm">
                                                {isPdfSource ? "PDF" : "JPG · PNG · WebP"}
                                            </span>
                                            <ArrowRightLeft className="h-5 w-5 text-gray-600" aria-hidden="true" />
                                            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-gray-800 shadow-sm">
                                                {isPdfSource ? "JPG · PNG · WebP" : "PDF"}
                                            </span>
                                        </div>
                                        <div className="mb-3 flex items-center gap-3">
                                            <tool.icon className={`h-8 w-8 ${tool.iconColor}`} aria-hidden="true" />
                                            <h3 className="text-2xl font-bold text-gray-900">{tool.title}</h3>
                                        </div>
                                        <p className="mb-4 text-sm leading-relaxed text-gray-700">{tool.short}</p>
                                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                                            {tool.points.map((point) => (
                                                <li key={point}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-8 flex items-center text-sm font-semibold text-blue-700">
                                        <span>Get started</span>
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <div id="all-tools" className="scroll-mt-8">
                    <ToolsExplorer />
                </div>

                <section aria-labelledby="why-heading" className="space-y-6">
                    <h2 id="why-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Why use these tools
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {BENEFITS.map((benefit) => (
                            <div key={benefit.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <benefit.icon className="mb-3 h-7 w-7 text-blue-700" aria-hidden="true" />
                                <h3 className="mb-2 font-bold text-gray-900">{benefit.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-700">{benefit.text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sm text-gray-700">
                        Want to know more? Read the{" "}
                        <Link href="/features" className="text-blue-700 underline">
                            guides
                        </Link>{" "}
                        or the{" "}
                        <Link href="/faq" className="text-blue-700 underline">
                            FAQ
                        </Link>
                        .
                    </p>
                </section>
            </div>
        </main>
    );
}
