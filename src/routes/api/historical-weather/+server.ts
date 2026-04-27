import { json } from '@sveltejs/kit';
import { fetchHistoricalWeather } from '$lib/api/historicalWeather';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const month = Number(url.searchParams.get('month'));
	const day = Number(url.searchParams.get('day'));

	if (!month || !day) {
		return json({ error: 'month and day are required' }, { status: 400 });
	}

	const data = await fetchHistoricalWeather(month, day);
	return json(data);
};
