import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  MousePointerClick,
  Smartphone,
  Upload,
  Settings2,
  Download,
  Lock,
  Heart,
  Flame,
} from "lucide-react";
import ToolsExplorer from "@/app/pdf-converter/ToolsExplorer";
import { TOOLS } from "@/lib/tools";
import { FAQ_ITEMS } from "@/app/faq/faq-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypdf.site").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Free Online PDF Tools – Merge, Split, Compress & Convert | mypdf.site",
  description:
    "Use free online PDF tools to merge, split, compress, rotate, watermark, number and convert PDF files. Private browser-based tools with no signup.",
  keywords: [
    "free online pdf tools",
    "merge pdf online",
    "split pdf online",
    "compress pdf online free",
    "pdf to jpg converter",
    "jpg to pdf converter",
    "rotate pdf pages",
    "add watermark to pdf",
    "add page numbers to pdf",
    "pdf tools without upload",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "mypdf.site",
    title: "Free Online PDF Tools – Merge, Split, Compress & Convert | mypdf.site",
    description:
      "Merge, split, compress, rotate, watermark, number and convert PDFs free in your browser. No signup. Files are not uploaded for processing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online PDF Tools | mypdf.site",
    description: "Merge, split, compress and convert PDFs free in your browser. Private, fast and no signup.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/**
 * Editorial order of tools, most commonly used PDF tasks first.
 * This is a judgement based on the usual lineup of well-known PDF sites, not measured
 * traffic data. When you have real analytics, reorder this list by actual usage.
 * IDs that do not exist in TOOLS are ignored; tools not listed are placed at the end.
 */
const TOOL_POPULARITY_ORDER = [
  "merge-pdf",
  "compress-pdf",
  "pdf-to-word",
  "split-pdf",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "edit-pdf",
  "rotate-pdf",
  "page-numbers",
  "watermark-pdf",
  "image-sheet",
];
const MOST_USED_COUNT = 6;

const orderedTools = (() => {
  const rank = new Map(TOOL_POPULARITY_ORDER.map((id, index) => [id, index]));
  return [...TOOLS].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
})();

const POPULAR_TASKS: { label: string; toolId: string }[] = [
  { label: "Combine invoices into one PDF", toolId: "merge-pdf" },
  { label: "Make a PDF smaller for email", toolId: "compress-pdf" },
  { label: "Convert a PDF to an editable Word file", toolId: "pdf-to-word" },
  { label: "Pull one chapter out of a long PDF", toolId: "split-pdf" },
  { label: "Remove a page before sharing", toolId: "split-pdf" },
  { label: "Turn phone photos into a PDF", toolId: "jpg-to-pdf" },
  { label: "Save a PDF page as an image", toolId: "pdf-to-jpg" },
  { label: "Fix a sideways scan", toolId: "rotate-pdf" },
  { label: "Number the pages of a report", toolId: "page-numbers" },
  { label: "Mark a document as CONFIDENTIAL", toolId: "watermark-pdf" },
];

const STEPS = [
  { icon: Upload, title: "Choose your file", text: "Select a PDF or image, or drag it onto the page. It opens inside your browser and is not uploaded to our server." },
  { icon: Settings2, title: "Set your options", text: "Pick pages, order, size or style. Previews show the result before you create the file." },
  { icon: Download, title: "Download the result", text: "A progress window runs to 100%, then the Download button appears. Closing the tab clears the working data." },
];

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "Private by design", text: "Files are processed on your own device, so they are not sent to our servers." },
  { icon: Zap, title: "No upload queues", text: "The work starts when you click. Speed depends on your device and file size." },
  { icon: MousePointerClick, title: "No sign-up", text: "Open a tool and start. No account or installation is needed." },
  { icon: Smartphone, title: "Works on phones", text: "Touch-friendly layouts for phones and tablets as well as computers." },
];

const FAQ_PREVIEW_IDS = ["is-it-free", "files-uploaded", "verify-privacy", "file-size"];

export default function Home() {
  const faqPreview = FAQ_PREVIEW_IDS.map((id) => FAQ_ITEMS.find((faq) => faq.id === id)).filter(
    (faq): faq is (typeof FAQ_ITEMS)[number] => Boolean(faq)
  );
  const mostUsed = orderedTools.slice(0, MOST_USED_COUNT);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "mypdf.site",
    url: SITE_URL,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    description:
      "Free browser-based PDF tools to merge, split, rotate, watermark, number and convert PDF files without uploading them to a server.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: orderedTools.map((tool) => tool.title),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="bg-gradient-to-b from-white to-gray-50 px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-800">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Files are processed on your device
          </span>

          <h1 className="mb-5 mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Free Online PDF Tools – Merge, Split, Compress &amp; Convert
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-700 sm:text-xl">
            Work with PDF files directly in your browser. Merge, split, compress, rotate, watermark, number and convert
            documents — free, private and without signup.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#popular" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-8 py-3.5 font-semibold text-white shadow-md transition-all hover:bg-blue-800">
              Most-used tools
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#tools" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 font-semibold text-gray-800 transition-all hover:bg-gray-50">
              Browse all tools
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <li>{TOOLS.length} tools</li>
            <li>No sign-up</li>
            <li>No installation</li>
            <li>Free to use</li>
          </ul>
        </div>
      </section>

      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-20">
          <section id="popular" aria-labelledby="popular-heading" className="scroll-mt-24 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="popular-heading" className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  <Flame className="h-6 w-6 text-orange-600" aria-hidden="true" />
                  Most-used PDF tools
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  The everyday PDF jobs, starting with the tasks people most often need.
                </p>
              </div>
              <a href="#all-tools-heading" className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline">
                See every tool
              </a>
            </div>

            <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mostUsed.map((tool, index) => (
                <li key={tool.id}>
                  <Link
                    href={tool.href}
                    className={`group flex h-full flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tool.cardBg}`}
                  >
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <tool.icon className={`h-8 w-8 ${tool.iconColor}`} aria-hidden="true" />
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                          #{index + 1}
                        </span>
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-gray-900">{tool.title}</h3>
                      <p className="text-sm leading-relaxed text-gray-800">{tool.short}</p>
                    </div>
                    <div className="mt-6 flex items-center text-sm font-semibold text-blue-800">
                      <span>Open tool</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div id="tools" className="scroll-mt-24">
            <ToolsExplorer />
          </div>

          <section aria-labelledby="all-tools-heading" className="scroll-mt-24 space-y-6">
            <div className="text-center">
              <h2 id="all-tools-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                All Free PDF Tools
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Every tool, with the most commonly used first.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orderedTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={tool.href}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <tool.icon className={`h-5 w-5 ${tool.iconColor}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{tool.title}</span>
                      <span className="block text-xs text-gray-700">{tool.short}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-500 transition group-hover:translate-x-1 group-hover:text-blue-700" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="tasks-heading" className="space-y-6">
            <div>
              <h2 id="tasks-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Popular tasks
              </h2>
              <p className="mt-1 text-sm text-gray-700">Not sure which tool you need? Start from what you want to do.</p>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR_TASKS.map((task) => {
                const tool = TOOLS.find((item) => item.id === task.toolId);
                if (!tool) return null;
                return (
                  <li key={task.label}>
                    <Link
                      href={tool.href}
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                        <tool.icon className={`h-5 w-5 ${tool.iconColor}`} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">{task.label}</span>
                        <span className="block text-xs text-gray-700">{tool.title}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-500 transition group-hover:translate-x-1 group-hover:text-blue-700" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24 space-y-6">
            <div className="text-center">
              <h2 id="how-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">How it works</h2>
              <p className="mt-1 text-sm text-gray-700">Three steps, the same for every tool.</p>
            </div>

            <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-bold text-white">{index + 1}</span>
                    <step.icon className="h-6 w-6 text-blue-700" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-700">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="why-heading" className="space-y-6">
            <h2 id="why-heading" className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">Why people use mypdf.site</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((highlight) => (
                <div key={highlight.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <highlight.icon className="mb-3 h-7 w-7 text-blue-700" aria-hidden="true" />
                  <h3 className="mb-2 font-bold text-gray-900">{highlight.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-700">{highlight.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-green-700 to-teal-700 p-8 text-white shadow-xl sm:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <ShieldCheck className="mx-auto mb-4 h-10 w-10" aria-hidden="true" />
              <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl">Your documents stay on your device</h2>
              <p className="mb-6 text-sm leading-relaxed text-green-50 sm:text-base">
                The tools run inside your browser, so contracts, IDs and statements are not uploaded to our server for processing.
                You can confirm this yourself in about a minute using your browser&apos;s developer tools.
              </p>
              <Link href="/features#privacy" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-green-800 shadow-md transition-all hover:bg-green-50">
                See how to check
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl space-y-5">
            <h2 id="faq-heading" className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">Quick answers</h2>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {faqPreview.map((faq) => (
                <details key={faq.id} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-900">
                    <span>{faq.question}</span>
                    <span className="text-xl leading-none text-gray-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-gray-700">{faq.answer}</p>
                </details>
              ))}
            </div>
            <p className="text-center text-sm">
              <Link href="/faq" className="font-semibold text-blue-700 underline">See all {FAQ_ITEMS.length} questions</Link>
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <Heart className="mx-auto mb-3 h-8 w-8 text-red-600" aria-hidden="true" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Enjoying the tools?</h2>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-gray-700">
              mypdf.site is free. If it saved you time, you can support the project, send an idea, or report a problem.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/support-project" className="inline-flex items-center justify-center rounded-xl bg-red-700 px-7 py-3 font-semibold text-white shadow-md hover:bg-red-800">
                Support the project
              </Link>
              <Link href="/feedback" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3 font-semibold text-gray-800 hover:bg-gray-50">
                Send feedback
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
