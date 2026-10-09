import type { Metadata } from 'next';
import { TOOLS } from './tools';

export const SITE_URL = 'https://mypdf.site';
export const SITE_NAME = 'mypdf.site';

const OG_IMAGE = `${SITE_URL}/og-image.png`;

function findTool(id: string) {
  return TOOLS.find((tool) => tool.id === id);
}

export function toolMetadata(id: string): Metadata {
  const tool = findTool(id);

  if (!tool) return {};

  const title = tool.seoTitle;
  const description = tool.seoDescription;
  const url = `${SITE_URL}${tool.href}`;

  return {
    title: {
      absolute: `${title} | ${SITE_NAME}`,
    },
    description,
    keywords: tool.keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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
  const tool = findTool(id);

  if (!tool) return null;

  const url = `${SITE_URL}${tool.href}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.seoTitle,
        url,
        description: tool.seoDescription,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires a modern web browser',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: tool.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: tool.seoTitle,
          },
        ],
      },
    ],
  };
}

export function jsonLdToScript(jsonLd: unknown): string {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}