import type { ReactNode } from 'react';
import { toolMetadata, toolJsonLd } from '@/lib/seo';

export const metadata = toolMetadata('page-numbers');

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd('page-numbers')) }}
            />
            {children}
        </>
    );
}