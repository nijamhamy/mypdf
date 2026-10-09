import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import {
    toolMetadata,
    toolJsonLd,
    jsonLdToScript,
} from '@/lib/seo';

export const metadata: Metadata = toolMetadata('jpg-to-pdf');

export default function Layout({ children }: { children: ReactNode }) {
    const jsonLd = toolJsonLd('jpg-to-pdf');

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