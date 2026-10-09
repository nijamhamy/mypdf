import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';



const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site').replace(/\/$/, '');



// Used when a page has no entry in PAGE_DATES below.
const DEFAULT_DATE = '2026-10-01';



// Change a date only when the main content of that page changes in a meaningful way.
// Do not update it for small edits such as a footer or copyright year.
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



export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [...STATIC_PATHS, ...TOOLS.map((t) => t.href)];
    const seen = new Set<string>();


    return paths
        .filter((p) => {
            if (seen.has(p)) return false;
            seen.add(p);
            return true;
        })
        .map((p) => ({
            url: p === '/' ? SITE_URL : `${SITE_URL}${p}`,
            lastModified: new Date(PAGE_DATES[p] ?? DEFAULT_DATE),
        }));
}