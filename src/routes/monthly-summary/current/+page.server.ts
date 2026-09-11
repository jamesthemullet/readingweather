import { error, redirect } from '@sveltejs/kit';
import { fetchMonthInProgress, type MonthInProgress } from '$lib/api/monthlySummary';
import { getCache, setCache } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const CACHE_TTL_MS = 60 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 5 * 60 * 1000;

export const load: PageServerLoad = async () => {
	const now = new Date();
	const cacheKey = `month-in-progress-${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
	const cached = getCache<MonthInProgress>(cacheKey);
	if (cached) return { progress: cached };

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		throw error(503, 'This page is temporarily unavailable — please try again in a few minutes.');
	}

	try {
		const progress = await fetchMonthInProgress(now);
		setCache(cacheKey, progress, CACHE_TTL_MS);
		return { progress };
	} catch (fetchErr) {
		// No usable data yet for the new month (e.g. very early on the 1st) — send
		// visitors to last month's completed report card instead of a dead end.
		if (fetchErr instanceof Error && fetchErr.message.includes('Not enough data available yet')) {
			const year = now.getUTCFullYear();
			const month = now.getUTCMonth() + 1;
			const last = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
			throw redirect(307, `/monthly-summary/${last.year}/${String(last.month).padStart(2, '0')}`);
		}
		setCache(errorCacheKey, true as const, ERROR_CACHE_TTL_MS);
		console.error('fetchMonthInProgress failed:', fetchErr);
		throw error(503, 'This page is temporarily unavailable — please try again in a few minutes.');
	}
};
