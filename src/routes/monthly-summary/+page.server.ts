import { getMonthlySummaryMonths } from '$lib/monthlySummaryMonths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const months = getMonthlySummaryMonths(new Date());

	setHeaders({ 'cache-control': 'public, max-age=3600' });

	return { months };
};
