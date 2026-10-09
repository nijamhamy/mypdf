import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';

const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site'
).replace(/\/$/, '');

const DEFAULT_DATE = '2026-10-01';

const PAGE_DATES: Record<string, string> = {
    '/': '2026-10-09',
    '/features': '2026-10-09',
    '/faq': '2026-10-09',
    '/image-sheet': '2026-10-09',
    '/pdf-to-word': '2026-10-05',
    '/edit-pdf': '2026-10-05',
};

const STATIC_PATHS: string[] = [
    '/',
    '/pdf-converter',
    '/features',
    '/faq',
    '/about',
    '/contact',
    '/feedback',
    '/support-project',
    '/privacy',
    '/terms',
    '/disclaimer',
];

const HIGH_PRIORITY_PATHS = new Set([
    '/',
    '/pdf-to-word',
    '/edit-pdf',
    '/merge-pdf',
    '/split-pdf',
    '/compress-pdf',
    '/pdf-to-jpg',
    '/jpg-to-pdf',
]);

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [...STATIC_PATHS, ...TOOLS.map((tool) => tool.href)];

    const seen = new Set<string>();

    return paths
        .map((path) => path.replace(/\/+$/, '') || '/')
        .filter((path) => {
            if (seen.has(path)) return false;
            seen.add(path);
            return true;
        })
        .map((path) => ({
            url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
            lastModified: new Date(PAGE_DATES[path] ?? DEFAULT_DATE),
            changeFrequency: path === '/' ? 'daily' : 'weekly',
            priority:
                path === '/'
                    ? 1.0
                    : HIGH_PRIORITY_PATHS.has(path)
                        ? 0.9
                        : 0.6,
        }));
}