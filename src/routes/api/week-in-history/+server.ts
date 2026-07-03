import { json } from '@sveltejs/kit';
import { fetchWeekInHistory, type WeekInHistory } from '$lib/api/weekInHistory';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const cacheKey = `week-in-history-${new Date().toISOString().slice(0, 10)}`;
	const cached = getCache<WeekInHistory>(cacheKey);
	if (cached) return json(cached);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: 'Week in history temporarily unavailable' }, { status: 502 });
	}

	try {
		const data = await fetchWeekInHistory();
		setCache(cacheKey, data, TTL_MS);
		return json(data);
	} catch (err) {
		// Avoid hammering an already-failing/rate-limited upstream on every request.
		setCache(errorCacheKey, true, ERROR_TTL_MS);
		console.error('fetchWeekInHistory failed:', err);
		return json({ error: 'Week in history temporarily unavailable' }, { status: 502 });
	}
};
