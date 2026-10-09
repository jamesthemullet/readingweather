import { fetchWeekInHistory, type WeekInHistory } from '$lib/api/weekInHistory';
import { withCachedFetch } from '$lib/server/withCachedFetch';
import type { RequestHandler } from './$types';

const TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const cacheKey = `week-in-history-${new Date().toISOString().slice(0, 10)}`;

	return withCachedFetch<WeekInHistory>(
		cacheKey,
		TTL_MS,
		ERROR_TTL_MS,
		fetchWeekInHistory,
		'Week in history temporarily unavailable'
	);
};
