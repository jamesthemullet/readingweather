import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

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
	condition: { category: 'cloudy' as const, label: 'cloudy' },
	streak: { type: 'wet' as const, emoji: '🌧️', length: 5, label: '5 consecutive days of rain' }
};

vi.mock('$lib/api/monthlySummary', () => ({
	fetchMonthlySummary: vi.fn()
}));

import { fetchMonthlySummary } from '$lib/api/monthlySummary';
import { GET } from './+server';

function makeEvent(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/api/monthly-summary');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return { url } as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('GET /api/monthly-summary', () => {
	it('returns 400 when year or month is missing', async () => {
		const response = await GET(makeEvent({ year: '2026' }));
		expect(response.status).toBe(400);
	});

	it('returns 400 when month is out of range', async () => {
		const response = await GET(makeEvent({ year: '2026', month: '13' }));
		expect(response.status).toBe(400);
	});

	it('returns 200 with the monthly summary', async () => {
		vi.mocked(fetchMonthlySummary).mockResolvedValue(mockSummary);

		const response = await GET(makeEvent({ year: '2026', month: '6' }));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.label).toBe('June 2026');
		expect(body.temperatureRank).toBe(3);
	});

	it('returns 400 when the requested month is not yet complete', async () => {
		vi.mocked(fetchMonthlySummary).mockRejectedValue(
			new Error('Monthly summary is only available for fully completed months')
		);

		const response = await GET(makeEvent({ year: '2026', month: '7' }));

		expect(response.status).toBe(400);
	});

	it('returns a 502 with an error body when the upstream fetch fails', async () => {
		vi.mocked(fetchMonthlySummary).mockRejectedValue(new Error('Open-Meteo error: 429'));

		const response = await GET(makeEvent({ year: '2026', month: '6' }));

		expect(response.status).toBe(502);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	it('does not call the upstream again while a recent failure is cached', async () => {
		vi.mocked(fetchMonthlySummary).mockRejectedValue(new Error('Open-Meteo error: 429'));
		await GET(makeEvent({ year: '2026', month: '6' }));

		vi.mocked(fetchMonthlySummary).mockClear();
		const response = await GET(makeEvent({ year: '2026', month: '6' }));

		expect(response.status).toBe(502);
		expect(fetchMonthlySummary).not.toHaveBeenCalled();
	});
});
