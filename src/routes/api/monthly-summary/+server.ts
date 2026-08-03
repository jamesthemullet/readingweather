import { json } from '@sveltejs/kit';
import { fetchMonthlySummary, type MonthlySummary } from '$lib/api/monthlySummary';
import { getCache, setCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

const TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export const GET: RequestHandler = async ({ url }) => {
	const year = Number(url.searchParams.get('year'));
	const month = Number(url.searchParams.get('month'));

	if (!year || !month || month < 1 || month > 12) {
		return json({ error: 'year and month are required' }, { status: 400 });
	}

	const cacheKey = `monthly-summary-${year}-${month}`;
	const cached = getCache<MonthlySummary>(cacheKey);
	if (cached) return json(cached);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: 'Monthly summary temporarily unavailable' }, { status: 502 });
	}

	try {
		const data = await fetchMonthlySummary(year, month);
		setCache(cacheKey, data, TTL_MS);
		return json(data);
	} catch (err) {
		if (err instanceof Error && err.message.includes('fully completed months')) {
			return json({ error: err.message }, { status: 400 });
		}
		// Avoid hammering an already-failing/rate-limited upstream on every request.
		setCache(errorCacheKey, true, ERROR_TTL_MS);
		console.error('fetchMonthlySummary failed:', err);
		return json({ error: 'Monthly summary temporarily unavailable' }, { status: 502 });
	}
};
