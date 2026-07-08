import type { RequestHandler } from '@sveltejs/kit';
import { fetchSitemapPosts, generateSitemapXml } from '$lib/server/sitemap';

const staticRoutes = [
	{ path: '/', changefreq: 'daily', priority: '1.0' },
	{ path: '/about', changefreq: 'monthly', priority: '0.8' },
	{ path: '/archives', changefreq: 'monthly', priority: '0.6' },
	{ path: '/gallery', changefreq: 'monthly', priority: '0.6' },
	{ path: '/photographs', changefreq: 'monthly', priority: '0.6' },
	{ path: '/seasonal-forecasts', changefreq: 'monthly', priority: '0.8' },
	{ path: '/useful-links', changefreq: 'monthly', priority: '0.5' }
];

export const GET: RequestHandler = async () => {
	const base = 'https://www.readingweather.co.uk';

	try {
		const nodes = await fetchSitemapPosts();
		const xml = generateSitemapXml(nodes, staticRoutes, base);

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
