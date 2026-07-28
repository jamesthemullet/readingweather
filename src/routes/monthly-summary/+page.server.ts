import { listMonthlySummaryMonths } from '$lib/server/monthlySummaryMonths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const months = listMonthlySummaryMonths();

	setHeaders({ 'cache-control': 'public, max-age=3600' });

	return { months };
};
