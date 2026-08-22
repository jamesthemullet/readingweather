import { error } from '@sveltejs/kit';
import { fetchRecordsTracker, type RecordsTrackerResult } from '$lib/api/recordsTracker';
import { getCache, setCache } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const TTL_MS = 12 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

// Shared cache key format with /api/records so the first caller (page or API)
// warms the cache for both.
function todayCacheKey() {
	return `records-tracker-${new Date().toISOString().slice(0, 10)}`;
}

export const load: PageServerLoad = async ({ setHeaders }) => {
	const cacheKey = todayCacheKey();
	const cached = getCache<RecordsTrackerResult>(cacheKey);
	if (cached) {
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=43200' });
		return { records: cached };
	}

	if (getCache<true>(`${cacheKey}-error`)) {
		throw error(503, 'Weather records are temporarily unavailable — please try again in a few minutes.');
	}

	try {
		const data = await fetchRecordsTracker();
		setCache(cacheKey, data, TTL_MS);
		// New records can be set any day, so this stays fresh in step with the 12-hour TTL.
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=43200' });
		return { records: data };
	} catch (err) {
		setCache(`${cacheKey}-error`, true, ERROR_TTL_MS);
		console.error('fetchRecordsTracker failed:', err);
		throw error(503, 'Weather records are temporarily unavailable — please try again in a few minutes.');
	}
};
