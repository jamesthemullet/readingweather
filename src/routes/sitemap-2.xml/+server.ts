import type { RequestHandler } from '@sveltejs/kit';
import { listMonthlySummaryMonths } from '$lib/server/monthlySummaryMonths';
import { fetchSitemapPosts, generateSitemapXml, type StaticRoute } from '$lib/server/sitemap';

const staticRoutes: StaticRoute[] = [
	{ path: '/', changefreq: 'daily', priority: '1.0' },
	{ path: '/about', changefreq: 'monthly', priority: '0.8' },
	{ path: '/archives', changefreq: 'monthly', priority: '0.6' },
	{ path: '/monthly-summary', changefreq: 'monthly', priority: '0.6' },
	{ path: '/photographs', changefreq: 'monthly', priority: '0.6' },
	{ path: '/seasonal-forecasts', changefreq: 'monthly', priority: '0.8' },
	{ path: '/useful-links', changefreq: 'monthly', priority: '0.5' }
];

export const GET: RequestHandler = async () => {
	const base = 'https://www.readingweather.co.uk';

	try {
		const nodes = await fetchSitemapPosts();
		// Each report card is immutable once published, so 'yearly' reflects how
		// rarely it's worth Google re-crawling rather than how it's presented.
		const monthlySummaryRoutes: StaticRoute[] = listMonthlySummaryMonths().map(
			({ year, month }) => ({
				path: `/monthly-summary/${year}/${String(month).padStart(2, '0')}`,
				changefreq: 'yearly',
				priority: '0.6'
			})
		);
		const xml = generateSitemapXml(nodes, [...staticRoutes, ...monthlySummaryRoutes], base);

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
