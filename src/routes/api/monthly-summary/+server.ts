import { json } from '@sveltejs/kit';
import { fetchMonthlySummary, type MonthlySummary } from '$lib/api/monthlySummary';
import { withCachedFetch } from '$lib/server/withCachedFetch';
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

	return withCachedFetch<MonthlySummary>(
		cacheKey,
		TTL_MS,
		ERROR_TTL_MS,
		() => fetchMonthlySummary(year, month),
		'Monthly summary temporarily unavailable',
		(err) => {
			if (err instanceof Error && err.message.includes('fully completed months')) {
				return json({ error: err.message }, { status: 400 });
			}
		}
	);
};
