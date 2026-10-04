import type { ReactNode } from 'react';
import { toolMetadata, toolJsonLd } from '@/lib/seo';

export const metadata = toolMetadata('split-pdf');

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd('split-pdf')) }}
            />
            {children}
        </>
    );
}