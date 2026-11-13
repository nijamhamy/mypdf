import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import { formatDate, getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import "../blog-content.css";

export const revalidate = 300;
export const dynamicParams = true; // new Blogger posts work without a redeploy

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypdf.site").replace(/\/$/, "");
const DEFAULT_OG = `${SITE_URL}/og-image.png`;

type Props = { params: Promise<{ slug: string }> };

const loadPost = cache((slug: string) => getPostBySlug(slug));

export async function generateStaticParams() {
    try {
        return (await getAllPosts()).map((p) => ({ slug: p.slug }));
    } catch {
        return []; // the build must not fail if Blogger is unreachable
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = await loadPost((await params).slug);
    if (!post) return { robots: { index: false, follow: false } };

    const path = `/blogs/${post.slug}`;
    const image = post.image ?? DEFAULT_OG;

    return {
        title: post.title, // the layout template appends " | mypdf.site"
        description: post.excerpt,
        keywords: post.labels,
        authors: [{ name: "mypdf.site", url: SITE_URL }],
        alternates: { canonical: path },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
        openGraph: {
            type: "article",
            url: `${SITE_URL}${path}`,
            siteName: "mypdf.site",
            title: post.title,
            description: post.excerpt,
            publishedTime: post.published,
            modifiedTime: post.updated,
            authors: ["mypdf.site"],
            tags: post.labels,
            images: [{ url: image, width: 1200, height: 630, alt: post.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
            images: [image],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const post = await loadPost((await params).slug);
    if (!post) notFound();

    const related = await getRelatedPosts(post, 3);
    const url = `${SITE_URL}/blogs/${post.slug}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": `${url}#article`,
                headline: post.title,
                description: post.excerpt,
                image: [post.image ?? DEFAULT_OG],
                datePublished: post.published,
                dateModified: post.updated,
                wordCount: post.wordCount,
                keywords: post.labels.join(", "),
                ...(post.labels[0] ? { articleSection: post.labels[0] } : {}),
                inLanguage: "en",
                isPartOf: { "@id": `${SITE_URL}/#website` },
                mainEntityOfPage: { "@type": "WebPage", "@id": url },
                author: { "@type": "Organization", name: "mypdf.site", url: SITE_URL },
                publisher: { "@id": `${SITE_URL}/#organization` },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                    { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
                    { "@type": "ListItem", position: 3, name: post.title, item: url },
                ],
            },
        ],
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

            <article className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
                    <Link href="/" className="hover:underline">Home</Link> / <Link href="/blogs" className="hover:underline">Blogs</Link>
                </nav>

                <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">{post.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <time dateTime={post.published}>{formatDate(post.published)}</time>
                    {post.updated.slice(0, 10) !== post.published.slice(0, 10) && (
                        <>
                            <span aria-hidden="true">•</span>
                            <span>Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>
                        </>
                    )}
                    <span aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{post.readMinutes} min read</span>
                </div>

                {post.headings.length >= 3 && (
                    <nav aria-label="Table of contents" className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                        <p className="mb-2 font-semibold text-gray-900">In this article</p>
                        <ol className="space-y-1">
                            {post.headings.map((h) => (
                                <li key={h.id} className={h.level === 3 ? "ml-4" : undefined}>
                                    <a href={`#${h.id}`} className="text-blue-700 hover:underline">{h.text}</a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                <div className="blog-content mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />

                {post.labels.length > 0 && (
                    <ul className="mt-10 flex flex-wrap gap-2 border-t border-gray-200 pt-6">
                        {post.labels.map((label) => (
                            <li key={label}>
                                <Link href={`/blogs/label/${encodeURIComponent(label)}`} className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-800 hover:bg-red-100">
                                    #{label.replace(/\s+/g, "")}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="mt-8 text-sm"><Link href="/blogs" className="font-semibold text-blue-700 underline">Back to all blogs</Link></p>
            </article>

            {related.length > 0 && (
                <section aria-labelledby="related-heading" className="mx-auto mt-12 max-w-7xl">
                    <h2 id="related-heading" className="mb-6 text-2xl font-bold text-gray-900">Keep reading</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((p) => <BlogCard key={p.id} post={p} />)}
                    </div>
                </section>
            )}
        </main>
    );
}