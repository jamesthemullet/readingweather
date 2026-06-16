import { fetchGraphQL } from '$lib/graphql/api';
import { getCache, setCache } from './cache';

const ALL_POSTS_SITEMAP_QUERY = `
  query AllPostsForSitemap {
    posts(first: 10000) {
      nodes {
        slug
        date
      }
    }
  }
`;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export type SitemapNode = { slug: string; date: string | null };

export type StaticRoute = { path: string; changefreq: string; priority: string };

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function toXmlUrl(loc: string, lastmod?: string, changefreq = 'monthly', priority = '0.7'): string {
	const last = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
	return `
    <url>
      <loc>${escapeXml(loc)}</loc>
      ${last}
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
}

export async function fetchSitemapPosts(): Promise<SitemapNode[]> {
	const cached = getCache<SitemapNode[]>('sitemap-posts');
	if (cached) return cached;

	const data = await fetchGraphQL<{ posts: { nodes: SitemapNode[] } }>(ALL_POSTS_SITEMAP_QUERY);
	const nodes = data.posts.nodes;
	setCache('sitemap-posts', nodes, CACHE_TTL_MS);
	return nodes;
}

export function generateSitemapXml(nodes: SitemapNode[], staticRoutes: StaticRoute[], base: string): string {
	const urls: string[] = [];

	for (const r of staticRoutes) {
		urls.push(toXmlUrl(`${base}${r.path}`, undefined, r.changefreq, r.priority));
	}

	for (const node of nodes) {
		const loc = `${base}/${node.slug}`;
		const lastmod = node.date ? node.date.slice(0, 10) : undefined;
		urls.push(toXmlUrl(loc, lastmod, 'monthly', '0.7'));
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}
