import Link from "next/link";
import { TOOLS } from "@/lib/tools";

interface ToolSeoContentProps {
  /** Must match a tool id in TOOLS. */
  id: string;
  /** Tool-specific usage steps (required). */
  steps: string[];
  /** Optional overrides. If omitted, the tool's own fields in lib/tools are used. */
  intro?: string;
  useCases?: string[];
  tips?: string[];
  limitations?: string[];
  /** Set to false if the page already shows its own privacy note. */
  showPrivacyNote?: boolean;
}

function Section({ id, title, items, ordered = false }: { id: string; title: string; items: string[]; ordered?: boolean }) {
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <section aria-labelledby={id} className="mt-8">
      <h3 id={id} className="text-xl font-bold text-gray-900">{title}</h3>
      <List className={`mt-4 space-y-2 pl-5 leading-relaxed text-gray-800 ${ordered ? "list-decimal space-y-3" : "list-disc"}`}>
        {items.map((item, index) => (
          <li key={`${id}-${index}`}>{item}</li>
        ))}
      </List>
    </section>
  );
}

export default function ToolSeoContent({
  id,
  steps,
  intro,
  useCases,
  tips,
  limitations,
  showPrivacyNote = true,
}: ToolSeoContentProps) {
  const tool = TOOLS.find((item) => item.id === id);
  if (!tool) return null;

  const introText = intro ?? tool.intro ?? tool.short;
  const useCaseList = useCases ?? tool.useCases ?? [];
  const tipList = tips ?? tool.tips ?? [];
  const limitList = limitations ?? tool.limitations ?? [];
  const points = tool.points ?? [];
  const faqs = tool.faqs ?? [];

  const sameCategory = TOOLS.filter((item) => item.id !== tool.id && item.category === tool.category);
  const others = TOOLS.filter((item) => item.id !== tool.id && item.category !== tool.category);
  const relatedTools = [...sameCategory, ...others].slice(0, 4);

  const headingId = `${tool.id}-guide-heading`;

  return (
    <section aria-labelledby={headingId} className="mx-auto mt-10 max-w-5xl rounded-2xl border border-gray-100 bg-white p-6 sm:p-10">
      <header>
        <h2 id={headingId} className="text-2xl font-bold text-gray-900 sm:text-3xl">Guide: {tool.title}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-gray-700">{introText}</p>
      </header>

      <Section id={`${tool.id}-steps-heading`} title="How to use it" items={steps} ordered />
      <Section id={`${tool.id}-usecases-heading`} title="When this tool helps" items={useCaseList} />
      <Section id={`${tool.id}-features-heading`} title="What it can do" items={points} />
      <Section id={`${tool.id}-tips-heading`} title="Tips for better results" items={tipList} />
      <Section id={`${tool.id}-limits-heading`} title="Limits to know about" items={limitList} />

      {faqs.length > 0 && (
        <section aria-labelledby={`${tool.id}-faq-heading`} className="mt-8">
          <h3 id={`${tool.id}-faq-heading`} className="text-xl font-bold text-gray-900">Frequently asked questions</h3>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <summary className="cursor-pointer font-semibold text-gray-900">{faq.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-800">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {relatedTools.length > 0 && (
        <nav aria-labelledby={`${tool.id}-related-heading`} className="mt-8">
          <h3 id={`${tool.id}-related-heading`} className="text-xl font-bold text-gray-900">Related tools</h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedTools.map((relatedTool) => (
              <li key={relatedTool.id}>
                <Link href={relatedTool.href} className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50">
                  <span className="block font-semibold text-gray-900">{relatedTool.title}</span>
                  <span className="mt-1 block text-sm text-gray-700">{relatedTool.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {showPrivacyNote && (
        <aside className="mt-8 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-950">
          <p className="font-semibold">Where your files are processed</p>
          <p className="mt-1 leading-relaxed">
            This tool works in your browser on your own device, and your file is not uploaded to our servers for processing. See the{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link> for how the site handles other information.
          </p>
        </aside>
      )}
    </section>
  );
}
