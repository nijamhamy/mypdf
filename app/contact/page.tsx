'use client';

import { useState } from 'react';
import { Mail, Send, MapPin, Phone, CheckCircle2, Loader2 } from 'lucide-react';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !message) {
            alert('Please fill in all fields.');
            return;
        }

        setIsSubmitting(true);
        // Simulate form submission
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            setName('');
            setEmail('');
            setMessage('');
        }, 1200);
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Have questions, feedback, or need support with mypdf.site? We'd love to hear from you!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Contact Info Card */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 md:col-span-1">
                        <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Feel free to reach out to us directly via email or through the form. We aim to respond within 24 hours.
                        </p>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Us</p>
                                    <a href="mailto:mypdfayan@gmail.com" className="text-sm font-medium text-blue-600 hover:underline">
                                        mypdfayan@gmail.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                                    <p className="text-sm font-medium text-gray-700">Online PDF Utility Platform</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm md:col-span-2">
                        {submitted ? (
                            <div className="py-12 text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Message Sent Successfully!</h3>
                                <p className="text-gray-600 max-w-md mx-auto text-sm">
                                    Thank you for reaching out. We have received your message and will get back to you at mypdfayan@gmail.com soon.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="How can we help you today?"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Sending Message...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                </div>

            </div>
        </main>
    );
}