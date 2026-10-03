'use client';

import { useState } from 'react';
import { Heart, Coffee, Star, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SupportProjectPage() {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(5);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isSupported, setIsSupported] = useState(false);

    const handleSupport = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSupported(true);
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 rounded-2xl mb-4 shadow-sm">
                        <Heart className="w-8 h-8 fill-red-500 text-red-500" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                        Support mypdf.site
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Our tools will always remain 100% free, fast, and secure. If mypdf.site has saved your time, consider supporting our ongoing development!
                    </p>
                </div>

                {isSupported ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Thank You for Your Support!</h3>
                        <p className="text-gray-600 max-w-md mx-auto text-sm">
                            Your generosity keeps mypdf.site running, ad-light, and completely free for everyone around the world.
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-all"
                            >
                                <span>Back to Home</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Why Support Info */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 md:col-span-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900">Why Donate?</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Maintaining secure client-side infrastructure, improving code performance, and adding new PDF features takes time and dedication.
                                </p>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                    <span>No Subscriptions Ever</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Star className="w-5 h-5 text-amber-500" />
                                    <span>Always Open & Free</span>
                                </div>
                            </div>
                        </div>

                        {/* Donation Form */}
                        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm md:col-span-2">
                            <form onSubmit={handleSupport} className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose an Amount</h3>

                                <div className="grid grid-cols-3 gap-4">
                                    {[3, 5, 10].map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => {
                                                setSelectedAmount(amount);
                                                setCustomAmount('');
                                            }}
                                            className={`py-4 rounded-2xl border font-bold text-lg transition-all flex items-center justify-center gap-1 ${selectedAmount === amount
                                                    ? 'bg-red-50 border-red-500 text-red-600 shadow-sm'
                                                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Coffee className="w-5 h-5" />
                                            <span>${amount}</span>
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Or enter custom amount ($)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setSelectedAmount(null);
                                        }}
                                        placeholder="e.g. 15"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <Heart className="w-5 h-5 fill-white" />
                                    <span>Support Project Now</span>
                                </button>
                            </form>
                        </div>

                    </div>
                )}

            </div>
        </main>
    );
}