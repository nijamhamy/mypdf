const cleanUrl = (value: string) =>
    value
        .trim()
        .replace(/\/+$/, '');

export const SITE = {
    name: 'mypdf.site',
    url: cleanUrl(
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site'
    ),
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'mypdfayan@gmail.com',
    owner: 'Ayan Hub',
    country: 'Sri Lanka',
    lastUpdated: '2026-10-04',
} as const;