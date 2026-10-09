import { fetchWeeklyDigest, type WeeklyDigest } from '$lib/api/weeklyDigest';
import { withCachedFetch } from '$lib/server/withCachedFetch';
import type { RequestHandler } from './$types';

const TTL_MS = 12 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const cacheKey = `weekly-digest-${new Date().toISOString().slice(0, 10)}`;

	return withCachedFetch<WeeklyDigest>(
		cacheKey,
		TTL_MS,
		ERROR_TTL_MS,
		fetchWeeklyDigest,
		'Weekly digest temporarily unavailable'
	);
};
