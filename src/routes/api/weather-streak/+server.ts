import { json } from '@sveltejs/kit';
import { fetchWeatherStreak, type WeatherStreakResult } from '$lib/api/weatherStreak';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 12 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

type CachedStreak = { result: WeatherStreakResult | null };

export const GET: RequestHandler = async () => {
	const cacheKey = `weather-streak-${new Date().toISOString().slice(0, 10)}`;
	const cached = getCache<CachedStreak>(cacheKey);
	if (cached) return json(cached.result);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: 'Weather streak temporarily unavailable' }, { status: 502 });
	}

	try {
		const data = await fetchWeatherStreak();
		setCache<CachedStreak>(cacheKey, { result: data }, TTL_MS);
		return json(data);
	} catch (err) {
		// Avoid hammering an already-failing/rate-limited upstream on every request.
		setCache(errorCacheKey, true, ERROR_TTL_MS);
		console.error('fetchWeatherStreak failed:', err);
		return json({ error: 'Weather streak temporarily unavailable' }, { status: 502 });
	}
};
