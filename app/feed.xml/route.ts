import { getAllPosts } from '@/lib/blog';

export const revalidate = 300;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site').replace(/\/$/, '');

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET() {
    let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
    try {
        posts = (await getAllPosts()).slice(0, 30);
    } catch (err) {
        console.error('[feed] getAllPosts failed:', err);
    }

    const items = posts
        .map(
            (p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/blogs/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blogs/${p.slug}</guid>
      <pubDate>${new Date(p.published).toUTCString()}</pubDate>
      <description>${esc(p.excerpt ?? '')}</description>
    </item>`
        )
        .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>mypdf.site Blogs</title>
    <link>${SITE_URL}/blogs</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Guides, tips and updates for everyday PDF work.</description>
    <language>en</language>${items}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
    });
}