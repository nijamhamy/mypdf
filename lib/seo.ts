import type { Metadata } from 'next';
import { TOOLS } from './tools';

export const SITE_URL = 'https://mypdf.site';
export const SITE_NAME = 'mypdf.site';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

function findTool(id: string) {
    return TOOLS.find((x) => x.id === id);
}

export function toolMetadata(id: string): Metadata {
    const t = findTool(id);
    if (!t) return {};

    const title = `${t.seoTitle} – Free, No Upload | ${SITE_NAME}`;
    const description = t.seoDescription;
    const url = `${SITE_URL}${t.href}`;

    return {
        title: { absolute: title },
        description,
        keywords: t.keywords,
        alternates: { canonical: url },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
        openGraph: {
            title,
            description,
            url,
            siteName: SITE_NAME,
            type: 'website',
            locale: 'en_US',
            images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t.seoTitle }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [OG_IMAGE],
        },
    };
}

export function toolJsonLd(id: string) {
    const t = findTool(id);
    if (!t) return null;
    const url = `${SITE_URL}${t.href}`;

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'SoftwareApplication',
                name: t.seoTitle,
                url,
                description: t.seoDescription,
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Any (web browser)',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
                '@type': 'FAQPage',
                mainEntity: t.faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: t.seoTitle, item: url },
                ],
            },
        ],
    };
}