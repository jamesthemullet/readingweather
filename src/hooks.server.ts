import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const { pathname } = event.url;

	// Dynamic pages: short-lived CDN cache so fresh content gets through
	if (pathname === '/') {
		response.headers.set('cache-control', 'public, max-age=300, stale-while-revalidate=60');
	} else if (pathname === '/seasonal-forecasts') {
		response.headers.set('cache-control', 'public, max-age=3600, stale-while-revalidate=300');
	} else if (pathname === '/archives') {
		response.headers.set('cache-control', 'public, max-age=600, stale-while-revalidate=120');
	}
	// /about, /useful-links, /photographs are prerendered and served as static files

	return response;
};
