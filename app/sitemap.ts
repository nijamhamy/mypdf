import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';
import { getAllPosts, getAllLabels } from '@/lib/blog';

export const revalidate = 300;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site').replace(/\/$/, '');

// Update a date only when that page's content really changes
const DEFAULT_DATE = '2026-10-01';
const PAGE_DATES: Record<string, string> = {
    '/': '2026-10-09',
    '/features': '2026-10-09',
    '/faq': '2026-10-09',
    '/image-sheet': '2026-10-09',
    '/pdf-to-word': '2026-10-05',
    '/edit-pdf': '2026-10-05',
};

const STATIC_PATHS = [
    '/', '/pdf-converter', '/features', '/faq', '/about', '/contact',
    '/feedback', '/support-project', '/privacy', '/terms', '/disclaimer',
];

const HIGH_PRIORITY = new Set([
    '/', '/pdf-to-word', '/edit-pdf', '/merge-pdf', '/split-pdf',
    '/compress-pdf', '/pdf-to-jpg', '/jpg-to-pdf',
]);

// Must match the noindex threshold in the label page
const MIN_LABEL_POSTS = 2;

function toDate(value: string | null | undefined, fallback: Date): Date {
    if (!value) return fallback;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const epoch = new Date(0);

    // 1) Static and tool pages
    const seen = new Set<string>();
    const paths = [...STATIC_PATHS, ...TOOLS.map((t) => t.href)]
        .map((p) => p.replace(/\/+$/, '') || '/')
        .filter((p) => (seen.has(p) ? false : (seen.add(p), true)));

    const staticEntries: MetadataRoute.Sitemap = paths.map((path) => ({
        url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
        lastModified: new Date(PAGE_DATES[path] ?? DEFAULT_DATE),
        changeFrequency: path === '/' ? 'daily' : 'weekly',
        priority: path === '/' ? 1.0 : HIGH_PRIORITY.has(path) ? 0.9 : 0.6,
    }));

    // 2) Blog pages (from Blogger). If the API fails, still serve the static sitemap.
    let posts: Awaited<ReturnType<typeof getAllPosts>>;
    try {
        posts = await getAllPosts();
    } catch (err) {
        console.error('[sitemap] getAllPosts failed:', err);
        return staticEntries;
    }

    const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${SITE_URL}/blogs/${post.slug}`,
        lastModified: toDate(post.updated ?? post.published, epoch),
        changeFrequency: 'monthly',
        priority: 0.8,
        ...(post.image ? { images: [post.image] } : {}),
    }));

    const newest = posts.reduce<Date>((max, p) => {
        const d = toDate(p.updated ?? p.published, epoch);
        return d > max ? d : max;
    }, epoch);

    const blogIndex: MetadataRoute.Sitemap = [
        {
            url: `${SITE_URL}/blogs`,
            lastModified: newest.getTime() > 0 ? newest : new Date(DEFAULT_DATE),
            changeFrequency: 'daily',
            priority: 0.7,
        },
    ];

    // 3) Label pages (only ones with enough posts) fetched via getAllLabels()
    let labelEntries: MetadataRoute.Sitemap = [];
    try {
        const allLabels = await getAllLabels();
        labelEntries = allLabels
            .filter((l) => l.count >= MIN_LABEL_POSTS)
            .map((l) => ({
                url: `${SITE_URL}/blogs/label/${encodeURIComponent(l.label)}`,
                lastModified: toDate(l.updated, epoch),
                changeFrequency: 'weekly',
                priority: 0.5,
            }));
    } catch (err) {
        console.error('[sitemap] getAllLabels failed:', err);
    }

    return [...staticEntries, ...blogIndex, ...postEntries, ...labelEntries];
}