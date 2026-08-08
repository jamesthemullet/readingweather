import { error } from '@sveltejs/kit';
import { fetchMonthlySummary, type MonthlySummary } from '$lib/api/monthlySummary';
import { getCache, setCache } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const SUMMARY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SUMMARY_ERROR_CACHE_TTL_MS = 5 * 60 * 1000;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const year = Number(params.year);
	const month = Number(params.month);

	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw error(404, 'Monthly summary not found');
	}

	const cacheKey = `monthly-summary-${year}-${month}`;
	const cached = getCache<MonthlySummary>(cacheKey);
	if (cached) {
		setHeaders({ 'cache-control': 'public, max-age=31536000, immutable' });
		return { summary: cached };
	}

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		throw error(503, 'This report is temporarily unavailable — please try again in a few minutes.');
	}

	try {
		const summary = await fetchMonthlySummary(year, month);
		setCache(cacheKey, summary, SUMMARY_CACHE_TTL_MS);
		setHeaders({ 'cache-control': 'public, max-age=31536000, immutable' });
		return { summary };
	} catch (fetchErr) {
		if (fetchErr instanceof Error && fetchErr.message.includes('fully completed months')) {
			throw error(404, 'Monthly summary not found');
		}
		setCache(errorCacheKey, true as const, SUMMARY_ERROR_CACHE_TTL_MS);
		console.error('fetchMonthlySummary failed:', fetchErr);
		throw error(503, 'This report is temporarily unavailable — please try again in a few minutes.');
	}
};
