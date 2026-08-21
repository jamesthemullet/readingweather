import { error } from '@sveltejs/kit';
import type { RecordsTrackerResult } from '$lib/api/recordsTracker';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const response = await fetch('/api/records');
	if (!response.ok) {
		throw error(503, 'Weather records are temporarily unavailable — please try again in a few minutes.');
	}

	const records = (await response.json()) as RecordsTrackerResult;

	// New records can be set any day, so this stays fresh in step with the
	// 12-hour TTL already applied to the underlying /api/records response.
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=43200' });

	return { records };
};
