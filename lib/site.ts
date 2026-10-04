const clean = (v: string) => v.replace(/\/$/, '');

export const SITE = {
    name: 'mypdf.site',
    url: clean(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site'),
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'mypdfayan@gmail.com',
    owner: 'Ayan Hub',
    country: 'Sri Lanka',
    lastUpdated: 'October 4, 2026',
} as const;