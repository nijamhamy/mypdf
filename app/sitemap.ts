import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site').replace(/\/$/, '');

const LAST_UPDATED = new Date('2026-10-04');

type Entry = {
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

const STATIC_PAGES: Entry[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pdf-converter', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/features', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/feedback', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/support-project', priority: 0.3, changeFrequency: 'yearly' },
    // Add these only after the pages exist, otherwise Search Console reports 404 errors:
    // { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    // { path: '/about', priority: 0.3, changeFrequency: 'yearly' },
    // { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const toolPages: Entry[] = TOOLS.map((t) => ({
        path: t.href,
        priority: 0.9,
        changeFrequency: 'monthly',
    }));

    const seen = new Set<string>();
    return [...STATIC_PAGES, ...toolPages]
        .filter((p) => {
            if (seen.has(p.path)) return false;
            seen.add(p.path);
            return true;
        })
        .map((p) => ({
            url: p.path === '/' ? SITE_URL : `${SITE_URL}${p.path}`,
            lastModified: LAST_UPDATED,
            changeFrequency: p.changeFrequency,
            priority: p.priority,
        }));
}