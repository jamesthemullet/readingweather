import { json } from '@sveltejs/kit';
import { fetchMonthInProgress, type MonthInProgress } from '$lib/api/monthlySummary';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const now = new Date();
	const cacheKey = `month-in-progress-${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
	const cached = getCache<MonthInProgress>(cacheKey);
	if (cached) return json(cached);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: 'Month in progress temporarily unavailable' }, { status: 502 });
	}

	try {
		const data = await fetchMonthInProgress(now);
		setCache(cacheKey, data, TTL_MS);
		return json(data);
	} catch (err) {
		if (err instanceof Error && err.message.includes('Not enough data available yet')) {
			return json({ error: err.message }, { status: 404 });
		}
		setCache(errorCacheKey, true, ERROR_TTL_MS);
		console.error('fetchMonthInProgress failed:', err);
		return json({ error: 'Month in progress temporarily unavailable' }, { status: 502 });
	}
};
