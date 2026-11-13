import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import BlogCard from "@/components/BlogCard";
import { getCanonicalLabel, getPostsByLabel } from "@/lib/blog";

export const revalidate = 300;
export const dynamicParams = true;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypdf.site").replace(/\/$/, "");
const MIN_LABEL_POSTS = 2; // keep in sync with sitemap.ts

type Props = { params: Promise<{ label: string }> };

function safeDecode(value: string): string | null {
    try {
        const decoded = decodeURIComponent(value).trim();
        return decoded.length > 0 && decoded.length <= 100 ? decoded : null;
    } catch {
        return null;
    }
}

// Shared by generateMetadata and the page, so it runs once per request
const loadLabel = cache(async (raw: string) => {
    const requested = safeDecode(raw);
    if (!requested) return null;
    const label = await getCanonicalLabel(requested);
    if (!label) return null;
    return { requested, label, posts: await getPostsByLabel(label) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const data = await loadLabel((await params).label);
    if (!data) return { robots: { index: false, follow: false } };

    const path = `/blogs/label/${encodeURIComponent(data.label)}`;
    const title = `${data.label} – PDF Guides & Tips`;
    const description = `Articles and guides about ${data.label} on mypdf.site.`;

    return {
        title,
        description,
        alternates: { canonical: path },
        robots: { index: data.posts.length >= MIN_LABEL_POSTS, follow: true },
        openGraph: {
            type: "website",
            url: `${SITE_URL}${path}`,
            title,
            description,
            siteName: "mypdf.site",
            images: [{ url: "/og-image.png", width: 1200, height: 630 }],
        },
    };
}

export default async function LabelPage({ params }: Props) {
    const data = await loadLabel((await params).label);
    if (!data || data.posts.length === 0) notFound(); // a real 404, not a soft 404

    const path = `/blogs/label/${encodeURIComponent(data.label)}`;
    // "pdf tips" and "PDF Tips" are the same topic: send one URL to the official spelling
    if (data.requested !== data.label) permanentRedirect(path);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
            { "@type": "ListItem", position: 3, name: data.label, item: `${SITE_URL}${path}` },
        ],
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
            <div className="mx-auto max-w-7xl">
                <p className="mb-2 text-sm"><Link href="/blogs" className="font-semibold text-blue-700 underline">All blogs</Link></p>
                <h1 className="mb-8 text-3xl font-extrabold text-gray-900">{data.label}</h1>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.posts.map((post) => <BlogCard key={post.id} post={post} />)}
                </div>
            </div>
        </main>
    );
}