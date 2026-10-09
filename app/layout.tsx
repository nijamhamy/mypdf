import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site'
).replace(/\/+$/, '');

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      'Free Online PDF Tools – Merge, Split, Compress & Convert | mypdf.site',
    template: '%s | mypdf.site',
  },

  description:
    'Use free online PDF tools to merge, split, compress, rotate, watermark, number and convert PDF files. Private browser-based tools with no signup.',

  applicationName: 'mypdf.site',

  icons: {
    icon: [
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '512x512',
      },
      {
        url: '/favicon.ico',
        sizes: '32x32',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
  },

  keywords: [
    'free online pdf tools',
    'merge pdf online',
    'split pdf online',
    'compress pdf online free',
    'pdf to jpg converter',
    'jpg to pdf converter',
    'pdf to word converter',
    'rotate pdf pages',
    'add watermark to pdf',
    'add page numbers to pdf',
    'pdf tools without upload',
  ],

  authors: [
    {
      name: 'mypdf.site',
      url: SITE_URL,
    },
  ],

  creator: 'mypdf.site',
  publisher: 'mypdf.site',

  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'mypdf.site',
    title:
      'Free Online PDF Tools – Merge, Split, Compress & Convert | mypdf.site',
    description:
      'Merge, split, compress, rotate, watermark, number and convert PDFs free in your browser. No signup. Files never leave your device.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'mypdf.site – Free Online PDF Tools',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Free Online PDF Tools | mypdf.site',
    description:
      'Merge, split, compress and convert PDFs free in your browser. Private, fast and no signup.',
    images: ['/og-image.png'],
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

  ...(GSC_VERIFICATION
    ? {
      verification: {
        google: GSC_VERIFICATION,
      },
    }
    : {}),

  ...(ADSENSE_CLIENT
    ? {
      other: {
        'google-adsense-account': ADSENSE_CLIENT,
      },
    }
    : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'mypdf.site',
  alternateName: 'MyPDF',
  url: SITE_URL,
  inLanguage: 'en',
  description:
    'Free online PDF tools to merge, split, compress, rotate, watermark, number and convert PDF files without uploading them.',
  publisher: {
    '@type': 'Organization',
    name: 'mypdf.site',
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>

      <body
        className={`${inter.className} bg-gray-50 text-gray-900 flex flex-col min-h-screen antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-white focus:text-blue-700 focus:font-semibold focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        <Navbar />

        <div id="main-content" className="flex-grow">
          {children}
        </div>

        <Footer />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </body>

      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}