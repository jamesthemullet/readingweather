import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

vi.mock('$lib/api/monthlySummary', () => ({
	fetchMonthlySummary: vi.fn()
}));

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn(() => null),
	setCache: vi.fn()
}));

import { fetchMonthlySummary } from '$lib/api/monthlySummary';

const mockSummary = {
	year: 2026,
	month: 6,
	monthName: 'June',
	label: 'June 2026',
	yearsOfData: 87,
	temperature: { high: 28.5, low: 9.2, mean: 17.1, historicalAverageMean: 15.8 },
	rainfall: {
		total: 42.3,
		wettestDay: { date: '2026-06-14', value: 18.2 },
		historicalAverageTotal: 50.1
	},
	sunshine: {
		totalHours: 210.4,
		sunniestDay: { date: '2026-06-21', hours: 14.8 },
		historicalAverageHours: 190.2
	},
	temperatureRank: 3,
	headline: 'June 2026 was the 3rd warmest June in Reading since 1940',
	records: {
		hottestDay: { date: '2026-06-20', year: 2026, value: 32.1 },
		coldestDay: { date: '1962-06-02', year: 1962, value: 1.2 },
		wettestDay: { date: '1971-06-14', year: 1971, value: 40.5 }
	},
	condition: { category: 'sunny' as const, label: 'sunny' },
	streak: { type: 'dry' as const, emoji: '☀️', length: 7, label: '7 consecutive dry days' }
};

function makeEvent(params: Record<string, string>) {
	return {
		params,
		setHeaders: vi.fn()
	} as unknown as Parameters<typeof load>[0];
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('monthly-summary/[year]/[month] load', () => {
	it('loads the summary from the API and sets an immutable cache header', async () => {
		vi.mocked(fetchMonthlySummary).mockResolvedValue(mockSummary);
		const event = makeEvent({ year: '2026', month: '06' });

		const result = await load(event);

		expect(result).toEqual({ summary: mockSummary });
		expect(fetchMonthlySummary).toHaveBeenCalledWith(2026, 6);
		expect(event.setHeaders).toHaveBeenCalledWith({
			'cache-control': 'public, max-age=31536000, immutable'
		});
	});

	it('throws a 404 when the month param is out of range', async () => {
		const event = makeEvent({ year: '2026', month: '13' });

		await expect(load(event)).rejects.toMatchObject({ status: 404 });
		expect(fetchMonthlySummary).not.toHaveBeenCalled();
	});

	it('throws a 404 when the API reports the month is not yet fully completed', async () => {
		vi.mocked(fetchMonthlySummary).mockRejectedValue(
			new Error('Monthly summaries are only available for fully completed months')
		);
		const event = makeEvent({ year: '2026', month: '07' });

		await expect(load(event)).rejects.toMatchObject({ status: 404 });
	});

	it('throws a 503 when the API reports the upstream is temporarily unavailable', async () => {
		vi.mocked(fetchMonthlySummary).mockRejectedValue(new Error('Open-Meteo error: 502'));
		const event = makeEvent({ year: '2026', month: '07' });

		await expect(load(event)).rejects.toMatchObject({ status: 503 });
	});
});
