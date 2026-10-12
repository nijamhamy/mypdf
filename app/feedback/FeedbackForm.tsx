"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import {
    AlertCircle, Bug, Check, CheckCircle2, Copy, Heart, HelpCircle, Lightbulb,
    Loader2, Mail, MessageSquare, Send, ShieldCheck, Star,
} from "lucide-react";

type FbType = "bug" | "feature" | "praise" | "question" | "other";

const TYPES: { id: FbType; label: string; icon: ElementType; hint: string }[] = [
    { id: "bug", label: "Bug report", icon: Bug, hint: "Something did not work as expected. Tell us the steps you took and what happened." },
    { id: "feature", label: "Feature request", icon: Lightbulb, hint: "Describe the tool or option you would like and how you would use it." },
    { id: "praise", label: "Compliment", icon: Heart, hint: "Tell us what worked well for you." },
    { id: "question", label: "Question", icon: HelpCircle, hint: "Ask anything. Check the FAQ first, as it may already be answered." },
    { id: "other", label: "Other", icon: MessageSquare, hint: "Anything else you would like to share." },
];

const TOOLS = [
    "General / whole website", "Merge PDF", "Split PDF", "Rotate PDF", "Add Watermark",
    "Add Page Numbers", "JPG to PDF", "PDF to JPG", "PDF to Word", "PDF Converter", "Compress PDF",
];

const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent" };

const MIN_LEN = 10;
const MAX_LEN = 2000;
const DRAFT_KEY = "mypdf-feedback-draft";
const LAST_KEY = "mypdf-feedback-last";
const COOLDOWN_MS = 30_000;
const FALLBACK_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
const PRIVACY_HREF = "/privacy";

function readStorage(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
}
function removeStorage(key: string) {
    try { localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
}

export default function FeedbackForm() {
    const [type, setType] = useState<FbType>("feature");
    const [tool, setTool] = useState(TOOLS[0]);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [wantsReply, setWantsReply] = useState(false);
    const [includeTech, setIncludeTech] = useState(false);
    const [website, setWebsite] = useState("");

    const [touched, setTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFallback, setShowFallback] = useState(false);
    const [refId, setRefId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);

    const startedAt = useRef<number>(Date.now());
    const loaded = useRef(false);

    // Only the non-personal parts of the draft are stored in this browser.
    useEffect(() => {
        try {
            const raw = readStorage(DRAFT_KEY);
            if (raw) {
                const draft = JSON.parse(raw);
                if (TYPES.some((item) => item.id === draft.type)) setType(draft.type);
                if (TOOLS.includes(draft.tool)) setTool(draft.tool);
                if (Number.isInteger(draft.rating) && draft.rating >= 1 && draft.rating <= 5) setRating(draft.rating);
                if (typeof draft.message === "string" && draft.message) {
                    setMessage(draft.message.slice(0, MAX_LEN));
                    setDraftRestored(true);
                }
            }
        } catch { /* ignore invalid draft */ }
        loaded.current = true;
    }, []);

    useEffect(() => {
        if (!loaded.current) return;
        const timer = setTimeout(() => {
            writeStorage(DRAFT_KEY, JSON.stringify({ type, tool, rating, message }));
        }, 400);
        return () => clearTimeout(timer);
    }, [type, tool, rating, message]);

    useEffect(() => { setIncludeTech(type === "bug"); }, [type]);

    const techInfo = useCallback(() => {
        if (typeof window === "undefined") return "";
        return [
            `UA: ${navigator.userAgent}`,
            `Viewport: ${window.innerWidth}x${window.innerHeight}`,
            `Screen: ${window.screen.width}x${window.screen.height}`,
            `Language: ${navigator.language}`,
        ].join(" | ");
    }, []);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const errors = useMemo(() => {
        const result: Record<string, string> = {};
        if (message.trim().length < MIN_LEN) result.message = `Please write at least ${MIN_LEN} characters.`;
        if (email.trim() && !emailValid) result.email = "Please enter a valid email address.";
        if (wantsReply && !emailValid) result.email = "An email address is needed so we can reply.";
        return result;
    }, [message, email, emailValid, wantsReply]);

    const currentType = TYPES.find((item) => item.id === type) ?? TYPES[0];
    const activeRating = hoverRating || rating;

    const onRatingKey = (event: KeyboardEvent) => {
        if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); setRating((value) => Math.min(5, value + 1)); }
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); setRating((value) => Math.max(1, value - 1)); }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (submitting) return;
        setTouched(true);
        setError(null);
        setShowFallback(false);
        if (Object.keys(errors).length > 0) return;

        const last = Number(readStorage(LAST_KEY) || 0);
        if (Date.now() - last < COOLDOWN_MS) {
            setError("Please wait a few seconds before sending another message.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type, tool, rating, message, name, email, wantsReply,
                    tech: includeTech ? techInfo() : "",
                    website,
                    elapsed: Date.now() - startedAt.current,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                setShowFallback(Boolean(data.fallback));
                return;
            }
            writeStorage(LAST_KEY, String(Date.now()));
            removeStorage(DRAFT_KEY);
            setRefId(String(data.id ?? ""));
        } catch {
            setError("Network error. Check your connection and try again.");
            setShowFallback(true);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setRefId(null);
        setMessage("");
        setTouched(false);
        setError(null);
        setDraftRestored(false);
        setRating(5);
        setType("feature");
        startedAt.current = Date.now();
    };

    const copyRef = async () => {
        if (!refId) return;
        try {
            await navigator.clipboard.writeText(refId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard may be unavailable */ }
    };

    const mailtoHref = FALLBACK_EMAIL
        ? `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(`[mypdf.site] ${currentType.label} - ${tool}`)}&body=${encodeURIComponent(`${message}\n\n${includeTech ? techInfo() : ""}`)}`
        : "";

    const fieldCls = "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm bg-white";

    if (refId !== null) {
        return (
            <div className="py-10 text-center space-y-4" role="status" aria-live="polite">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-700 rounded-full">
                    <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Thank you for your feedback</h3>
                <p className="text-gray-700 max-w-md mx-auto text-sm leading-relaxed">
                    Your message was submitted.{" "}
                    {wantsReply
                        ? "You asked for a reply, so we may contact the email address you provided. We cannot promise a response time."
                        : "You did not ask for a reply, so we may use your message to improve the site."}
                </p>
                {refId && (
                    <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm">
                        <span className="text-gray-700">Reference</span>
                        <span className="font-mono font-semibold text-gray-900">{refId}</span>
                        <button type="button" onClick={copyRef} className="p-1 rounded hover:bg-gray-200" aria-label="Copy reference">
                            {copied ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-gray-700" />}
                        </button>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button type="button" onClick={resetForm} className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md">
                        Send another message
                    </button>
                    <Link href="/" className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold py-2.5 px-6 rounded-xl hover:bg-gray-50">
                        Back to tools
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <fieldset>
                <legend className="block text-sm font-semibold text-gray-800 mb-3">What kind of feedback is this?</legend>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TYPES.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            onClick={() => setType(item.id)}
                            aria-pressed={type === item.id}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition ${type === item.id ? "border-blue-700 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                        >
                            <item.icon className="w-5 h-5" aria-hidden="true" />
                            {item.label}
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-gray-700">{currentType.hint}</p>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="fb-tool" className="block text-sm font-medium text-gray-800 mb-2">Which tool is it about?</label>
                    <select id="fb-tool" value={tool} onChange={(e) => setTool(e.target.value)} className={`${fieldCls} border-gray-300`}>
                        {TOOLS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                </div>

                <div>
                    <span id="fb-rating-label" className="block text-sm font-medium text-gray-800 mb-2">How would you rate your experience?</span>
                    <div role="radiogroup" aria-labelledby="fb-rating-label" onKeyDown={onRatingKey} className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={rating === star}
                                aria-label={`${star} star${star > 1 ? "s" : ""} - ${RATING_LABELS[star]}`}
                                tabIndex={rating === star ? 0 : -1}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-transform hover:scale-110"
                            >
                                <Star className={`w-8 h-8 ${activeRating >= star ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                            </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-700 font-medium" aria-live="polite">{RATING_LABELS[activeRating]}</span>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="fb-message" className="block text-sm font-medium text-gray-800">Your message (required)</label>
                    <span className={`text-xs ${message.length > MAX_LEN - 100 ? "text-amber-800" : "text-gray-700"}`}>{message.length}/{MAX_LEN}</span>
                </div>
                <textarea
                    id="fb-message"
                    rows={6}
                    value={message}
                    maxLength={MAX_LEN}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={touched && Boolean(errors.message)}
                    aria-describedby={touched && errors.message ? "fb-message-error" : undefined}
                    placeholder={type === "bug" ? "1) What did you do? 2) What did you expect? 3) What happened instead?" : "Tell us what you think..."}
                    className={`${fieldCls} resize-none ${touched && errors.message ? "border-red-600" : "border-gray-300"}`}
                />
                {touched && errors.message && <p id="fb-message-error" className="mt-1 text-xs text-red-700">{errors.message}</p>}
                {draftRestored && message && <p className="mt-1 text-xs text-gray-700">We restored your unsent message draft from this browser.</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="fb-name" className="block text-sm font-medium text-gray-800 mb-2">Your name (optional)</label>
                    <input id="fb-name" type="text" value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="Your name" className={`${fieldCls} border-gray-300`} />
                </div>
                <div>
                    <label htmlFor="fb-email" className="block text-sm font-medium text-gray-800 mb-2">
                        Your email {wantsReply ? "(required for a reply)" : "(optional)"}
                    </label>
                    <input
                        id="fb-email"
                        type="email"
                        value={email}
                        maxLength={120}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={touched && Boolean(errors.email)}
                        aria-describedby={touched && errors.email ? "fb-email-error" : undefined}
                        placeholder="you@example.com"
                        className={`${fieldCls} ${touched && errors.email ? "border-red-600" : "border-gray-300"}`}
                    />
                    {touched && errors.email && <p id="fb-email-error" className="mt-1 text-xs text-red-700">{errors.email}</p>}
                </div>
            </div>

            <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm text-gray-800">
                    <input type="checkbox" checked={wantsReply} onChange={(e) => setWantsReply(e.target.checked)} className="mt-0.5 accent-blue-700" />
                    <span>I would like a reply to this message.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-gray-800">
                    <input type="checkbox" checked={includeTech} onChange={(e) => setIncludeTech(e.target.checked)} className="mt-0.5 accent-blue-700" />
                    <span>
                        Include technical details (browser, screen size, language) to help us investigate problems.
                        {includeTech && <span className="block mt-1 text-xs text-gray-700 break-words">Will send: {techInfo()}</span>}
                    </span>
                </label>
            </div>

            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                    Website
                    <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
            </div>

            {error && (
                <div role="alert" className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <div className="space-y-2">
                        <p>{error}</p>
                        {showFallback && mailtoHref && (
                            <a href={mailtoHref} className="inline-flex items-center gap-1.5 font-semibold underline">
                                <Mail className="w-4 h-4" aria-hidden="true" /> Send by email instead
                            </a>
                        )}
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /><span>Sending...</span></>
                ) : (
                    <><Send className="w-5 h-5" aria-hidden="true" /><span>Send feedback</span></>
                )}
            </button>

            <p className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-green-700" aria-hidden="true" />
                <span>
                    Do not paste private document contents or sensitive personal data. We receive what you type in this form and any technical details you choose to include. See the{" "}
                    <Link href={PRIVACY_HREF} className="underline text-blue-700">Privacy Policy</Link> for how messages are handled.
                </span>
            </p>
        </form>
    );
}
