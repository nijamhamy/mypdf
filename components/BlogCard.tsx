import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { formatDate, type BlogPost } from "@/lib/blog";

export default function BlogCard({ post }: { post: BlogPost }) {
    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            {post.image && (
                <Link href={`/blogs/${post.slug}`} tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image} alt="" loading="lazy" className="h-48 w-full object-cover" />
                </Link>
            )}
            <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                    <time dateTime={post.published}>{formatDate(post.published)}</time>
                    <span aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{post.readMinutes} min read</span>
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">
                    <Link href={`/blogs/${post.slug}`} className="hover:text-red-700">{post.title}</Link>
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-gray-700">{post.excerpt}</p>

                {post.labels.length > 0 && (
                    <ul className="mb-4 flex flex-wrap gap-2">
                        {post.labels.slice(0, 4).map((label) => (
                            <li key={label}>
                                <Link href={`/blogs/label/${encodeURIComponent(label)}`} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100">
                                    #{label.replace(/\s+/g, "")}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <Link href={`/blogs/${post.slug}`} className="mt-auto inline-flex items-center text-sm font-semibold text-blue-800" aria-label={`Read more: ${post.title}`}>
                    Read more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
            </div>
        </article>
    );
}