import { TOOLS } from '@/lib/tools';

export default function ToolSeoContent({ id, steps }: { id: string; steps: string[] }) {
    const t = TOOLS.find((x) => x.id === id);
    if (!t) return null;

    return (
        <section className="max-w-5xl mx-auto mt-10 bg-white rounded-2xl border border-gray-100 p-6 sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900">How to use {t.seoTitle}</h2>
            <ol className="mt-4 list-decimal pl-5 space-y-2 text-gray-700">
                {steps.map((s) => <li key={s}>{s}</li>)}
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Features</h2>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-700">
                {t.points.map((p) => <li key={p}>{p}</li>)}
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Frequently asked questions</h2>
            <div className="mt-4 space-y-3">
                {t.faqs.map((f) => (
                    <details key={f.q} className="rounded-xl border border-gray-200 p-4">
                        <summary className="font-semibold text-gray-800 cursor-pointer">{f.q}</summary>
                        <p className="mt-2 text-gray-600">{f.a}</p>
                    </details>
                ))}
            </div>

            <p className="mt-8 text-sm text-gray-500">
                Your files are processed in your browser on your own device and are not uploaded to our servers.
            </p>
        </section>
    );
}