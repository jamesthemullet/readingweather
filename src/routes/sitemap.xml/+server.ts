import type { RequestHandler } from '@sveltejs/kit';
import { fetchGraphQL } from '$lib/graphql/api';

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

function toXmlUrl(loc: string, lastmod?: string, changefreq = 'monthly', priority = '0.7') {
	const last = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
	return `
    <url>
      <loc>${loc}</loc>
      ${last}
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
}

export const GET: RequestHandler = async () => {
	const base = 'https://www.readingweather.co.uk';

	try {
		const data = await fetchGraphQL(ALL_POSTS_SITEMAP_QUERY);
		const nodes = data?.posts?.nodes || [];

		const staticRoutes = [
			{ path: '/', changefreq: 'daily', priority: '1.0' },
			{ path: '/about', changefreq: 'monthly', priority: '0.8' },
			{ path: '/archives', changefreq: 'monthly', priority: '0.6' },
			{ path: '/photographs', changefreq: 'monthly', priority: '0.6' },
			{ path: '/seasonal-forecasts', changefreq: 'monthly', priority: '0.8' },
			{ path: '/useful-links', changefreq: 'monthly', priority: '0.5' }
		];

		const urls: string[] = [];

		// add static routes
		for (const r of staticRoutes) {
			urls.push(toXmlUrl(`${base}${r.path}`, undefined, r.changefreq, r.priority));
		}

		// add posts
		for (const node of nodes) {
			const loc = `${base}/${node.slug}`;
			// date from GraphQL is usually ISO; keep YYYY-MM-DD
			const lastmod = node.date ? node.date.slice(0, 10) : undefined;
			urls.push(toXmlUrl(loc, lastmod, 'monthly', '0.7'));
		}

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'max-age=0, s-maxage=3600'
			}
		});
	} catch (err) {
		console.error('Sitemap generation error', err);
		return new Response('Internal Server Error', { status: 500 });
	}
};
