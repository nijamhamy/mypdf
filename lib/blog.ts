import { cache } from "react";

const API_BASE = "https://www.googleapis.com/blogger/v3/blogs";
const REVALIDATE_SECONDS = 300; // new Blogger posts appear within ~5 minutes
const MAX_PAGES = 10; // 10 x 50 = 500 posts
const FETCH_TIMEOUT_MS = 10_000;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypdf.site").replace(/\/$/, "");

export interface Heading {
    id: string;
    text: string;
    level: 2 | 3;
}

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    html: string;
    image: string | null;
    labels: string[];
    published: string;
    updated: string;
    readMinutes: number;
    wordCount: number;
    headings: Heading[];
}

export interface LabelInfo {
    label: string;
    count: number;
    /** ISO date of the most recently updated post with this label. */
    updated: string;
}

interface RawPost {
    id: string;
    title: string;
    url: string;
    published: string;
    updated: string;
    labels?: string[];
    content?: string;
    images?: { url: string }[];
}

/* ----------------------------- text helpers ----------------------------- */

function decodeEntities(input: string): string {
    return input
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => {
            try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return " "; }
        })
        .replace(/&#(\d+);/g, (_m, dec: string) => {
            try { return String.fromCodePoint(Number(dec)); } catch { return " "; }
        })
        .replace(/&amp;/g, "&"); // last, so "&amp;lt;" is not double-decoded
}

const stripTags = (html: string) =>
    decodeEntities(
        html
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<[^>]+>/g, " ")
    )
        .replace(/\s+/g, " ")
        .trim();

function makeExcerpt(text: string, max = 155): string {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    const base = lastSpace > 100 ? cut.slice(0, lastSpace) : cut;
    return `${base.trimEnd().replace(/[,.;:\-–—]+$/, "")}…`;
}

/** Keeps letters from any script (Tamil, Arabic...) so heading IDs stay readable. */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
}

/** Blogger image URLs end in /s320/ or =s320; ask for a bigger size. */
export const bigImage = (url: string, size = 1200) =>
    url.replace(/\/s\d+(-[a-z0-9]+)?\//i, `/s${size}/`).replace(/=s\d+(-[a-z0-9]+)?$/i, `=s${size}`);

function slugFromUrl(url: string): string | null {
    try {
        const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
        const slug = last.replace(/\.html$/i, "");
        return slug || null;
    } catch {
        return null;
    }
}

/* ----------------------------- HTML cleaning ----------------------------- */

/**
 * Blogger content is written by you, but risky markup is removed anyway.
 * Also fixes things that matter for SEO: internal links, external link rel, image attributes.
 */
function cleanHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        // keep only YouTube embeds
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, (m) =>
            /src=["']https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//i.test(m)
                ? /\bloading=/i.test(m) ? m : m.replace(/<iframe/i, '<iframe loading="lazy"')
                : ""
        )
        .replace(/\son\w+="[^"]*"/gi, "")
        .replace(/\son\w+='[^']*'/gi, "")
        // links to the old blogspot URLs become links to this site
        .replace(
            /href=(["'])https?:\/\/[^"'\s]*\.blogspot\.[a-z.]+\/\d{4}\/\d{2}\/([^"'/?#\s]+?)\.html[^"']*\1/gi,
            (_m, q: string, slug: string) => `href=${q}/blogs/${slug}${q}`
        )
        // link hygiene
        .replace(/<a\s([^>]*?)>/gi, (m, attrs: string) => {
            const href = /href=["']([^"']+)["']/i.exec(attrs)?.[1];
            if (!href) return m;
            let a = attrs;
            if (/^\s*javascript:/i.test(href)) a = a.replace(/href=(["'])[^"']*\1/i, 'href="#"');
            const external = /^https?:\/\//i.test(href) && !href.startsWith(SITE_URL);
            if (external && !/\brel=/i.test(a)) a += ' rel="noopener noreferrer"';
            return `<a ${a.trim()}>`;
        })
        // image hygiene (lazy loading, decoding, never a missing alt attribute)
        .replace(/<img\s([^>]*?)\/?>/gi, (_m, attrs: string) => {
            let a = attrs;
            if (!/\bloading=/i.test(a)) a += ' loading="lazy"';
            if (!/\bdecoding=/i.test(a)) a += ' decoding="async"';
            if (!/\balt=/i.test(a)) a += ' alt=""';
            return `<img ${a.trim()} />`;
        });
}

/** Adds an id to every h2/h3 (for the table of contents and deep links). */
function addHeadingIds(html: string): { html: string; headings: Heading[] } {
    const used = new Set<string>();
    const headings: Heading[] = [];
    let n = 0;

    const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (m, lvl: string, attrs: string, inner: string) => {
        const text = stripTags(inner);
        if (!text) return m;
        n += 1;

        const existing = /\bid=["']([^"']+)["']/i.exec(attrs)?.[1];
        let id = existing ?? (slugify(text) || `section-${n}`);
        while (used.has(id)) id = `${id}-${n}`;
        used.add(id);

        headings.push({ id, text, level: Number(lvl) as 2 | 3 });
        return existing ? m : `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
    });

    return { html: out, headings };
}

/* ------------------------------- transform ------------------------------- */

function normalizeLabels(labels: string[] | undefined): string[] {
    const seen = new Map<string, string>();
    for (const raw of labels ?? []) {
        const label = raw.trim();
        if (label && !seen.has(label.toLowerCase())) seen.set(label.toLowerCase(), label);
    }
    return [...seen.values()];
}

function transform(raw: RawPost): BlogPost | null {
    const slug = slugFromUrl(raw.url);
    if (!slug) return null;

    const { html, headings } = addHeadingIds(cleanHtml(raw.content ?? ""));
    const text = stripTags(html);
    const words = text ? text.split(" ").length : 0;
    const firstImg = raw.images?.[0]?.url ?? /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] ?? null;

    return {
        id: raw.id,
        slug,
        title: raw.title,
        excerpt: makeExcerpt(text),
        html,
        image: firstImg ? bigImage(firstImg) : null,
        labels: normalizeLabels(raw.labels),
        published: raw.published,
        updated: raw.updated || raw.published,
        readMinutes: Math.max(1, Math.round(words / 200)),
        wordCount: words,
        headings,
    };
}

/* -------------------------------- fetching -------------------------------- */

async function fetchJson<T>(url: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS }, signal: ctrl.signal });
            if (!res.ok) throw new Error(`Blogger API responded ${res.status}`); // never log the URL: it holds the key
            return (await res.json()) as T;
        } catch (err) {
            lastError = err;
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Blogger API request failed");
}

/**
 * All live posts, newest first. Cached per request, revalidated every 5 minutes.
 * THROWS if Blogger cannot be reached, so Next.js keeps serving the last good page
 * instead of caching an empty blog (which would show 404s to Google).
 */
export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
    const key = process.env.BLOGGER_API_KEY;
    const blogId = process.env.BLOGGER_BLOG_ID;
    if (!key || !blogId) {
        console.error("[blog] BLOGGER_API_KEY or BLOGGER_BLOG_ID is not set");
        return [];
    }

    const bySlug = new Map<string, BlogPost>();
    let pageToken: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
        const params = new URLSearchParams({
            key,
            maxResults: "50",
            orderBy: "published",
            status: "live",
            fetchImages: "true",
            fields: "nextPageToken,items(id,title,url,published,updated,labels,content,images)",
        });
        if (pageToken) params.set("pageToken", pageToken);

        const data = await fetchJson<{ items?: RawPost[]; nextPageToken?: string }>(
            `${API_BASE}/${blogId}/posts?${params}`
        );

        for (const item of data.items ?? []) {
            const post = transform(item);
            if (!post) continue;
            if (bySlug.has(post.slug)) {
                console.warn(`[blog] duplicate slug "${post.slug}" skipped`);
                continue;
            }
            bySlug.set(post.slug, post);
        }

        pageToken = data.nextPageToken;
        if (!pageToken) break;
    }

    return [...bySlug.values()];
});

/* -------------------------------- queries -------------------------------- */

export async function getPostBySlug(slug: string) {
    return (await getAllPosts()).find((p) => p.slug === slug) ?? null;
}

export async function getPostsByLabel(label: string) {
    const wanted = label.toLowerCase();
    return (await getAllPosts()).filter((p) => p.labels.some((l) => l.toLowerCase() === wanted));
}

/** Labels grouped case-insensitively, so one topic never gets two pages. */
export async function getAllLabels(): Promise<LabelInfo[]> {
    const map = new Map<string, LabelInfo>();
    for (const p of await getAllPosts()) {
        for (const label of p.labels) {
            const key = label.toLowerCase();
            const cur = map.get(key);
            if (!cur) {
                map.set(key, { label, count: 1, updated: p.updated });
            } else {
                cur.count += 1;
                if (new Date(p.updated) > new Date(cur.updated)) cur.updated = p.updated;
            }
        }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Returns the one official spelling of a label, or null if no post uses it. */
export async function getCanonicalLabel(label: string): Promise<string | null> {
    const wanted = label.toLowerCase();
    return (await getAllLabels()).find((l) => l.label.toLowerCase() === wanted)?.label ?? null;
}

/** Posts that share labels with this one; filled up with the newest posts if there are too few. */
export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
    const all = (await getAllPosts()).filter((p) => p.id !== post.id);
    const mine = new Set(post.labels.map((l) => l.toLowerCase()));

    const related = all
        .map((p) => ({ p, score: p.labels.filter((l) => mine.has(l.toLowerCase())).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || +new Date(b.p.published) - +new Date(a.p.published))
        .map((x) => x.p)
        .slice(0, limit);

    if (related.length < limit) {
        const have = new Set(related.map((p) => p.id));
        for (const p of all) {
            if (related.length >= limit) break;
            if (!have.has(p.id)) related.push(p);
        }
    }
    return related;
}

export const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });