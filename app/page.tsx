import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, ShieldCheck, Zap, MousePointerClick, Smartphone, Upload, Settings2,
  Download, Lock, Heart,
} from 'lucide-react';
import ToolsExplorer from '@/app/pdf-converter/ToolsExplorer';
import { TOOLS } from '@/lib/tools';
import { FAQ_ITEMS } from '@/app/faq/faq-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site';

export const metadata: Metadata = {
  title: 'Free Online PDF Tools – Merge, Split, Compress | mypdf.site',
  description:
    'Merge, split, rotate, watermark, number and convert PDFs for free. Every tool runs in your browser, so your files are never uploaded.',
  alternates: { canonical: '/' },
};

const POPULAR_TASKS: { label: string; toolId: string }[] = [
  { label: 'Combine invoices into one PDF', toolId: 'merge-pdf' },
  { label: 'Pull one chapter out of a long PDF', toolId: 'split-pdf' },
  { label: 'Remove a page before sharing', toolId: 'split-pdf' },
  { label: 'Fix a sideways scan', toolId: 'rotate-pdf' },
  { label: 'Mark a document as CONFIDENTIAL', toolId: 'watermark-pdf' },
  { label: 'Number the pages of a report', toolId: 'page-numbers' },
  { label: 'Turn phone photos into a PDF', toolId: 'jpg-to-pdf' },
  { label: 'Save a PDF page as an image', toolId: 'pdf-to-jpg' },
  { label: 'Make a PDF smaller for email', toolId: 'compress-pdf' },
];

const STEPS = [
  { icon: Upload, title: 'Choose your file', text: 'Select a PDF or image, or drag it onto the page. It opens inside your browser and is not uploaded.' },
  { icon: Settings2, title: 'Set your options', text: 'Pick pages, order, size or style. Previews show the result before you create the file.' },
  { icon: Download, title: 'Download the result', text: 'A progress window runs to 100%, then the Download button appears. Closing the tab clears the working data.' },
];

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: 'Private by design', text: 'Files are processed on your own device, so they are not sent to our servers.' },
  { icon: Zap, title: 'Fast', text: 'No upload queues. The work starts when you click.' },
  { icon: MousePointerClick, title: 'No sign-up', text: 'Open a tool and start. No account or installation is needed.' },
  { icon: Smartphone, title: 'Works on phones', text: 'Touch-friendly layouts for phones and tablets as well as computers.' },
];

const FAQ_PREVIEW_IDS = ['is-it-free', 'files-uploaded', 'verify-privacy', 'file-size'];

export default function Home() {
  const faqPreview = FAQ_PREVIEW_IDS
    .map((id) => FAQ_ITEMS.find((f) => f.id === id))
    .filter((f): f is (typeof FAQ_ITEMS)[number] => !!f);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'mypdf.site',
    url: SITE_URL,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser',
    description:
      'Free browser-based PDF tools to merge, split, rotate, watermark, number and convert PDF files without uploading them.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: TOOLS.map((t) => t.title),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="bg-gradient-to-b from-white to-gray-50 pt-14 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold uppercase px-3 py-1 rounded-full tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Files never leave your device
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mt-5 mb-5">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Merge, split, rotate, watermark, number and convert your documents. Free, simple and processed
            right in your browser.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#tools"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-md transition-all"
            >
              Explore all tools <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3.5 px-8 rounded-xl hover:bg-gray-50 transition-all"
            >
              How it works
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <li>{TOOLS.length} tools</li>
            <li>No sign-up</li>
            <li>No installation</li>
            <li>Free to use</li>
          </ul>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto space-y-20">

          <div id="tools" className="scroll-mt-24">
            <ToolsExplorer />
          </div>

          <section aria-labelledby="tasks-heading" className="space-y-6">
            <div>
              <h2 id="tasks-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Popular tasks</h2>
              <p className="text-gray-600 text-sm mt-1">Not sure which tool you need? Start from what you want to do.</p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_TASKS.map((task) => {
                const tool = TOOLS.find((t) => t.id === task.toolId);
                if (!tool) return null;
                return (
                  <li key={task.label}>
                    <Link
                      href={tool.href}
                      className="group flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition"
                    >
                      <span className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">{task.label}</span>
                        <span className="block text-xs text-gray-500">{tool.title}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24 space-y-6">
            <div className="text-center">
              <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
              <p className="text-gray-600 text-sm mt-1">Three steps, the same for every tool.</p>
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">{i + 1}</span>
                    <s.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="why-heading" className="space-y-6">
            <h2 id="why-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Why people use mypdf.site</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h.icon className="w-7 h-7 text-blue-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">{h.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
            <div className="max-w-3xl mx-auto text-center">
              <ShieldCheck className="w-10 h-10 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Your documents stay yours</h2>
              <p className="text-green-50 text-sm sm:text-base leading-relaxed mb-6">
                The tools run inside your browser, so contracts, IDs and statements are not uploaded for processing.
                You can confirm this yourself in about a minute using your browser’s developer tools.
              </p>
              <Link
                href="/features#privacy"
                className="inline-flex items-center gap-2 bg-white text-green-700 font-bold py-3 px-8 rounded-xl shadow-md hover:bg-green-50 transition-all"
              >
                See how to check <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto w-full space-y-5">
            <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Quick answers</h2>
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden bg-white">
              {faqPreview.map((f) => (
                <details key={f.id} className="group">
                  <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 font-semibold text-gray-900">
                    <span>{f.question}</span>
                    <span className="text-gray-400 text-xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
            <p className="text-center text-sm">
              <Link href="/faq" className="text-blue-600 font-semibold underline">See all {FAQ_ITEMS.length} questions</Link>
            </p>
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center shadow-sm">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enjoying the tools?</h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-5 leading-relaxed">
              mypdf.site is free. If it saved you time, you can support the project, send an idea, or report a problem.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/support-project" className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-7 rounded-xl shadow-md">
                Support the project
              </Link>
              <Link href="/feedback" className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-7 rounded-xl hover:bg-gray-50">
                Send feedback
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}