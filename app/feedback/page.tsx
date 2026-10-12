import type { Metadata } from "next";
import Link from "next/link";
import { Bug, Clock, Lightbulb, MessageSquare } from "lucide-react";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
    title: "Send Feedback | mypdf.site",
    description:
        "Report a bug, request a feature or share feedback about mypdf.site. Your feedback helps improve the PDF tools.",
    alternates: { canonical: "/feedback" },
};

const TIPS = [
    {
        icon: Bug,
        title: "Found a bug?",
        text: "Tell us which tool you used, what you expected, what happened, and your browser and device. Do not include confidential document contents.",
    },
    {
        icon: Lightbulb,
        title: "Have an idea?",
        text: "Describe the task you are trying to finish, and we can consider how the tools might support it.",
    },
    {
        icon: Clock,
        title: "Need a reply?",
        text: "If the form offers a reply option, select it and enter an email address you can access. We cannot promise a response time.",
    },
];

export default function FeedbackPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-10">
                <header className="text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
                        <MessageSquare className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900">We value your feedback</h1>
                    <p className="mx-auto max-w-xl text-lg text-gray-700">
                        Report a problem, suggest a tool, or tell us what works well.
                    </p>
                </header>

                <section aria-labelledby="tips-heading">
                    <h2 id="tips-heading" className="sr-only">Tips for useful feedback</h2>
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {TIPS.map((tip) => (
                            <li key={tip.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <tip.icon className="mb-2 h-6 w-6 text-blue-700" aria-hidden="true" />
                                <h3 className="mb-1 text-sm font-bold text-gray-900">{tip.title}</h3>
                                <p className="text-xs leading-relaxed text-gray-700">{tip.text}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="feedback-form-heading" className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
                    <h2 id="feedback-form-heading" className="mb-6 text-2xl font-bold text-gray-900">Send your message</h2>
                    <FeedbackForm />
                    <p className="mt-6 text-xs leading-relaxed text-gray-700">
                        Information you submit, including an email address if you provide one, is used to review feedback and reply when requested. See the{" "}
                        <Link href="/privacy" className="text-blue-700 underline">Privacy Policy</Link> for details.
                    </p>
                </section>

                <p className="text-center text-sm text-gray-700">
                    Looking for quick answers? See the{" "}
                    <Link href="/faq" className="text-blue-700 underline">FAQ</Link> or the{" "}
                    <Link href="/features" className="text-blue-700 underline">guides</Link>.
                </p>
            </div>
        </main>
    );
}
