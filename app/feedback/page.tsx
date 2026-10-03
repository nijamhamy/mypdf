import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Bug, Lightbulb, Clock } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

export const metadata: Metadata = {
    title: 'Send Feedback | mypdf.site',
    description:
        'Report a bug, request a feature or tell us what you think about mypdf.site. Your feedback helps improve the PDF tools.',
    alternates: { canonical: '/feedback' },
};

export default function FeedbackPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-10">
                <header className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">We value your feedback</h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Report a problem, suggest a tool, or tell us what works. Every message is read.
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: Bug, t: 'Found a bug?', d: 'Tell us the steps and the tool. Technical details help us reproduce it.' },
                        { icon: Lightbulb, t: 'Have an idea?', d: 'Describe the task you are trying to finish and we will see how to support it.' },
                        { icon: Clock, t: 'Need an answer?', d: 'Tick “I would like a reply” and leave your email.' },
                    ].map((c) => (
                        <div key={c.t} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <c.icon className="w-6 h-6 text-blue-600 mb-2" />
                            <h2 className="font-bold text-gray-900 text-sm mb-1">{c.t}</h2>
                            <p className="text-xs text-gray-600 leading-relaxed">{c.d}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-sm relative">
                    <FeedbackForm />
                </div>

                <p className="text-center text-sm text-gray-500">
                    Looking for quick answers? See the <Link href="/faq" className="text-blue-600 underline">FAQ</Link> or the{' '}
                    <Link href="/features" className="text-blue-600 underline">guides</Link>.
                </p>
            </div>
        </main>
    );
}