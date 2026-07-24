import { error } from '@sveltejs/kit';
import type { MonthlySummary } from '$lib/api/monthlySummary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const year = Number(params.year);
	const month = Number(params.month);

	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw error(404, 'Monthly summary not found');
	}

	const response = await fetch(`/api/monthly-summary?year=${year}&month=${month}`);
	if (!response.ok) {
		throw error(404, 'Monthly summary not found');
	}

	const summary = (await response.json()) as MonthlySummary;

	// A page that loads successfully only ever describes a fully completed past
	// month, so its content never changes again once published.
	setHeaders({ 'cache-control': 'public, max-age=31536000, immutable' });

	return { summary };
};
