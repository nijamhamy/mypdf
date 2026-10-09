import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import {
    toolMetadata,
    toolJsonLd,
    jsonLdToScript,
} from '@/lib/seo';

export const metadata: Metadata = toolMetadata('pdf-to-jpg');

export default function Layout({ children }: { children: ReactNode }) {
    const jsonLd = toolJsonLd('pdf-to-jpg');

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