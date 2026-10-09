import Link from 'next/link';
import { TOOLS } from '@/lib/tools';

interface ToolSeoContentProps {
    id: string;
    steps: string[];
}

export default function ToolSeoContent({
    id,
    steps,
}: ToolSeoContentProps) {
    const tool = TOOLS.find((item) => item.id === id);

    if (!tool) return null;

    const relatedTools = TOOLS.filter(
        (item) => item.id !== tool.id && item.category === tool.category
    ).slice(0, 4);

    return (
        <section
            aria-labelledby={`${tool.id}-guide-heading`}
            className="max-w-5xl mx-auto mt-10 bg-white rounded-2xl border border-gray-100 p-6 sm:p-10"
        >
            <header>
                <h2
                    id={`${tool.id}-guide-heading`}
                    className="text-2xl sm:text-3xl font-bold text-gray-900"
                >
                    How to Use {tool.title} Online
                </h2>

                <p className="mt-3 max-w-3xl text-gray-600 leading-relaxed">
                    {tool.short} This free online PDF tool runs directly in your browser,
                    so you can complete the task without creating an account.
                </p>
            </header>

            <section
                aria-labelledby={`${tool.id}-steps-heading`}
                className="mt-8"
            >
                <h3
                    id={`${tool.id}-steps-heading`}
                    className="text-xl font-bold text-gray-900"
                >
                    How to Use {tool.title}
                </h3>

                <ol className="mt-4 list-decimal pl-5 space-y-3 text-gray-700 leading-relaxed">
                    {steps.map((step, index) => (
                        <li key={`${tool.id}-step-${index}`}>{step}</li>
                    ))}
                </ol>
            </section>

            <section
                aria-labelledby={`${tool.id}-features-heading`}
                className="mt-8"
            >
                <h3
                    id={`${tool.id}-features-heading`}
                    className="text-xl font-bold text-gray-900"
                >
                    Features of This Tool
                </h3>

                <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
                    {tool.points.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </section>

            <section
                aria-labelledby={`${tool.id}-faq-heading`}
                className="mt-8"
            >
                <h3
                    id={`${tool.id}-faq-heading`}
                    className="text-xl font-bold text-gray-900"
                >
                    Frequently Asked Questions
                </h3>

                <div className="mt-4 space-y-3">
                    {tool.faqs.map((faq) => (
                        <details
                            key={faq.q}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                            <summary className="cursor-pointer font-semibold text-gray-800">
                                {faq.q}
                            </summary>

                            <p className="mt-3 text-gray-600 leading-relaxed">
                                {faq.a}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            {relatedTools.length > 0 && (
                <section
                    aria-labelledby={`${tool.id}-related-heading`}
                    className="mt-8"
                >
                    <h3
                        id={`${tool.id}-related-heading`}
                        className="text-xl font-bold text-gray-900"
                    >
                        Related PDF Tools
                    </h3>

                    <p className="mt-2 text-gray-600">
                        You may also find these free online PDF tools useful.
                    </p>

                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {relatedTools.map((relatedTool) => (
                            <li key={relatedTool.id}>
                                <Link
                                    href={relatedTool.href}
                                    className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50"
                                >
                                    <span className="block font-semibold text-gray-900">
                                        {relatedTool.title}
                                    </span>

                                    <span className="mt-1 block text-sm text-gray-600">
                                        {relatedTool.short}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <aside className="mt-8 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
                <p className="font-semibold">Private by design</p>
                <p className="mt-1 leading-relaxed">
                    Your files are processed in your browser on your own device and are
                    not uploaded to our servers for processing.
                </p>
            </aside>
        </section>
    );
}