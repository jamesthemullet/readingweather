import { json } from '@sveltejs/kit';
import { fetchWeeklyDigest, type WeeklyDigest } from '$lib/api/weeklyDigest';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 12 * 60 * 60 * 1000;

export const GET: RequestHandler = async () => {
	const cacheKey = `weekly-digest-${new Date().toISOString().slice(0, 10)}`;
	const cached = getCache<WeeklyDigest>(cacheKey);
	if (cached) return json(cached);

	const data = await fetchWeeklyDigest();
	setCache(cacheKey, data, TTL_MS);
	return json(data);
};
