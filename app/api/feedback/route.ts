import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TYPES = ['bug', 'feature', 'praise', 'question', 'other'] as const;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest) {
    const fwd = req.headers.get('x-forwarded-for');
    return (fwd ? fwd.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}

function rateLimited(ip: string) {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
        hits.set(ip, recent);
        return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    return false;
}

const clean = (v: unknown, max: number) =>
    typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '';

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
    }

    if (clean(body.website, 100) !== '') {
        return NextResponse.json({ ok: true, id: 'FB-OK' });
    }
    const elapsed = Number(body.elapsed);
    if (!Number.isFinite(elapsed) || elapsed < 3000) {
        return NextResponse.json({ ok: false, error: 'Please take a moment to write your feedback.' }, { status: 400 });
    }

    const ip = clientIp(req);
    if (rateLimited(ip)) {
        return NextResponse.json({ ok: false, error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const type = TYPES.includes(body.type as (typeof TYPES)[number]) ? (body.type as string) : 'other';
    const tool = clean(body.tool, 60) || 'General';
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
    const message = clean(body.message, 2000);
    const name = clean(body.name, 80);
    const email = clean(body.email, 120);
    const wantsReply = body.wantsReply === true;
    const tech = clean(body.tech, 500);

    if (message.length < 10) {
        return NextResponse.json({ ok: false, error: 'Please write at least 10 characters.' }, { status: 400 });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (email && !emailOk) {
        return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (wantsReply && !emailOk) {
        return NextResponse.json({ ok: false, error: 'An email address is needed for a reply.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.FEEDBACK_TO_EMAIL;
    const from = process.env.FEEDBACK_FROM_EMAIL || 'mypdf.site <onboarding@resend.dev>';
    if (!apiKey || !to) {
        console.error('Feedback email is not configured (RESEND_API_KEY / FEEDBACK_TO_EMAIL).');
        return NextResponse.json({ ok: false, error: 'Feedback is not available right now.', fallback: true }, { status: 503 });
    }

    const id = 'FB-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    const text = [
        `Reference: ${id}`,
        `Type: ${type}`,
        `Tool: ${tool}`,
        `Rating: ${rating}/5`,
        `Name: ${name || '(not given)'}`,
        `Email: ${email || '(not given)'}`,
        `Wants a reply: ${wantsReply ? 'yes' : 'no'}`,
        tech ? `Technical info: ${tech}` : '',
        '',
        'Message:',
        message,
    ].filter((l) => l !== '').join('\n');

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to: [to],
                subject: `[mypdf.site] ${type} – ${tool} (${rating}/5) ${id}`,
                text,
                ...(emailOk ? { reply_to: email } : {}),
            }),
        });
        if (!res.ok) {
            console.error('Resend error', res.status, await res.text());
            return NextResponse.json({ ok: false, error: 'Could not send your feedback. Please try again.', fallback: true }, { status: 502 });
        }
        return NextResponse.json({ ok: true, id });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ ok: false, error: 'Network error while sending. Please try again.', fallback: true }, { status: 502 });
    }
}