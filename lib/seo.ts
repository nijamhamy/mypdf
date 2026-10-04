import type { Metadata } from 'next';
import { TOOLS } from './tools';

export function toolMetadata(id: string): Metadata {
    const t = TOOLS.find((x) => x.id === id);
    if (!t) return {};
    const title = `${t.title} Online – Free, No Upload | mypdf.site`;
    const description = `${t.short} Runs in your browser, so your files are never uploaded.`;
    return {
        title,
        description,
        alternates: { canonical: t.href },
        openGraph: { title, description, url: t.href, type: 'website' },
    };
}