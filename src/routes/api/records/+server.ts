import { json } from '@sveltejs/kit';
import { fetchRecordsTracker, type RecordsTrackerResult } from '$lib/api/recordsTracker';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 12 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const cacheKey = `records-tracker-${new Date().toISOString().slice(0, 10)}`;
	const cached = getCache<RecordsTrackerResult>(cacheKey);
	if (cached) return json(cached);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: 'Weather records temporarily unavailable' }, { status: 502 });
	}

	try {
		const data = await fetchRecordsTracker();
		setCache(cacheKey, data, TTL_MS);
		return json(data);
	} catch (err) {
		// Avoid hammering an already-failing/rate-limited upstream on every request.
		setCache(errorCacheKey, true, ERROR_TTL_MS);
		console.error('fetchRecordsTracker failed:', err);
		return json({ error: 'Weather records temporarily unavailable' }, { status: 502 });
	}
};
