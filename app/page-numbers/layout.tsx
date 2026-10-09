import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import {
    toolMetadata,
    toolJsonLd,
    jsonLdToScript,
} from '@/lib/seo';

export const metadata: Metadata = toolMetadata('page-numbers');

export default function Layout({ children }: { children: ReactNode }) {
    const jsonLd = toolJsonLd('page-numbers');

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