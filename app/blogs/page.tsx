import type { Metadata } from "next";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import { getAllLabels, getAllPosts } from "@/lib/blog";

export const revalidate = 300;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypdf.site").replace(/\/$/, "");

export const metadata: Metadata = {
    title: "Blogs – PDF Tips, Guides & Updates",
    description: "Practical guides and updates on working with PDF files: merging, compressing, converting and keeping documents private.",
    alternates: { canonical: "/blogs" },
    openGraph: {
        type: "website",
        url: `${SITE_URL}/blogs`,
        title: "Blogs – PDF Tips, Guides & Updates",
        description: "Practical guides and updates on working with PDF files.",
        siteName: "mypdf.site",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default async function BlogsPage() {
    const [posts, labels] = await Promise.all([getAllPosts(), getAllLabels()]);

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                name: "mypdf.site Blogs",
                url: `${SITE_URL}/blogs`,
                description: "Guides, tips and updates for everyday PDF work.",
                isPartOf: { "@id": `${SITE_URL}/#website` },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                    { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
                ],
            },
        ],
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Blogs</h1>
                    <p className="mx-auto mt-3 max-w-2xl text-gray-700">Guides, tips and updates for everyday PDF work.</p>
                </header>

                {labels.length > 0 && (
                    <ul className="mb-8 flex flex-wrap justify-center gap-2" aria-label="Topics">
                        {labels.map(({ label, count }) => (
                            <li key={label}>
                                <Link href={`/blogs/label/${encodeURIComponent(label)}`} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:border-red-400">
                                    {label} ({count})
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {posts.length === 0 ? (
                    <p className="text-center text-gray-700">No articles yet. Please check back soon.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => <BlogCard key={post.id} post={post} />)}
                    </div>
                )}
            </div>
        </main>
    );
}