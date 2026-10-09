import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import {
  toolMetadata,
  toolJsonLd,
  jsonLdToScript,
} from '@/lib/seo';

export const metadata: Metadata = toolMetadata('edit-pdf');

export default function Layout({ children }: { children: ReactNode }) {
  const jsonLd = toolJsonLd('edit-pdf');

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdToScript(jsonLd),
          }}
        />
      )}

      {children}
    </>
  );
}