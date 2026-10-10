import { fetchRecordsTracker, type RecordsTrackerResult } from '$lib/api/recordsTracker';
import { withCachedFetch } from '$lib/server/withCachedFetch';
import type { RequestHandler } from './$types';

const TTL_MS = 12 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const cacheKey = `records-tracker-${new Date().toISOString().slice(0, 10)}`;

	return withCachedFetch<RecordsTrackerResult>(
		cacheKey,
		TTL_MS,
		ERROR_TTL_MS,
		fetchRecordsTracker,
		'Weather records temporarily unavailable'
	);
};
