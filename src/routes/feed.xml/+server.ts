import type { RequestHandler } from '@sveltejs/kit';
import { fetchFeedPosts, generateFeedXml } from '$lib/server/feed';

export const GET: RequestHandler = async () => {
	const base = 'https://www.readingweather.co.uk';

	try {
		const nodes = await fetchFeedPosts();
		const xml = generateFeedXml(nodes, base);

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/rss+xml; charset=utf-8',
				'Cache-Control': 'max-age=0, s-maxage=1800'
			}
		});
	} catch (err) {
		console.error('Feed generation error', err);
		return new Response('Internal Server Error', { status: 500 });
	}
};
