import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site').replace(/\/$/, '');
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'mypdf.site – Free Online PDF Tools',
  description:
    'Merge, split, rotate, watermark, number and convert PDFs for free. Every tool runs in your browser, so your files are never uploaded.',
  applicationName: 'mypdf.site',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'mypdf.site',
    url: SITE_URL,
    title: 'mypdf.site – Free Online PDF Tools',
    description:
      'Merge, split, rotate, watermark, number and convert PDFs for free, right in your browser.',
  },
  twitter: {
    card: 'summary',
    title: 'mypdf.site – Free Online PDF Tools',
    description:
      'Merge, split, rotate, watermark, number and convert PDFs for free, right in your browser.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  ...(GSC_VERIFICATION ? { verification: { google: GSC_VERIFICATION } } : {}),
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
  url: SITE_URL,
  inLanguage: 'en',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 flex flex-col min-h-screen antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-white focus:text-blue-700 focus:font-semibold focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        <Navbar />
        <div id="main-content" className="flex-grow">{children}</div>
        <Footer />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c') }}
        />

        {ADSENSE_CLIENT && (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}