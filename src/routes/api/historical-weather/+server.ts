import { json } from '@sveltejs/kit';
import { type DailyWeather, fetchHistoricalWeather } from '$lib/api/historicalWeather';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async ({ url }) => {
	const month = Number(url.searchParams.get('month'));
	const day = Number(url.searchParams.get('day'));

	if (!month || !day) {
		return json({ error: 'month and day are required' }, { status: 400 });
	}

	const cacheKey = `historical-weather-${month}-${day}`;
	const cached = getCache<DailyWeather[]>(cacheKey);
	if (cached) return json(cached);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: 'Historical weather temporarily unavailable' }, { status: 502 });
	}

	try {
		const data = await fetchHistoricalWeather(month, day);
		setCache(cacheKey, data, TTL_MS);
		return json(data);
	} catch (err) {
		// Avoid hammering an already-failing/rate-limited upstream on every request.
		setCache(errorCacheKey, true, ERROR_TTL_MS);
		console.error('fetchHistoricalWeather failed:', err);
		return json({ error: 'Historical weather temporarily unavailable' }, { status: 502 });
	}
};
