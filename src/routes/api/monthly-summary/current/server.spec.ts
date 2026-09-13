import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

const mockProgress = {
	year: 2026,
	month: 8,
	monthName: 'August',
	label: 'August 2026',
	daysElapsed: 9,
	daysInMonth: 31,
	daysRemaining: 22,
	asOfDate: '2026-08-09',
	yearsOfData: 86,
	temperature: { meanSoFar: 20, historicalAverageMeanSoFar: 20, projectedMean: 20 },
	rainfall: { totalSoFar: 45, historicalAverageTotalSoFar: 9, projectedTotal: 67, projectedRankLabel: '1st wettest' },
	sunshine: { totalHoursSoFar: 45, historicalAverageHoursSoFar: 45, projectedHours: 155 },
	headline: 'August 2026 is on track to be the 1st wettest August in Reading since 1940, with 22 days still to go'
};

vi.mock('$lib/api/monthlySummary', () => ({
	fetchMonthInProgress: vi.fn()
}));

import { fetchMonthInProgress } from '$lib/api/monthlySummary';
import { GET } from './+server';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('GET /api/monthly-summary/current', () => {
	it('returns 200 with the month-in-progress data', async () => {
		vi.mocked(fetchMonthInProgress).mockResolvedValue(mockProgress);

		const response = await GET({} as unknown as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.label).toBe('August 2026');
		expect(body.rainfall.projectedRankLabel).toBe('1st wettest');
	});

	it('returns 404 when there is not enough data yet for the current month', async () => {
		vi.mocked(fetchMonthInProgress).mockRejectedValue(
			new Error('Not enough data available yet for the current month')
		);

		const response = await GET({} as unknown as Parameters<typeof GET>[0]);

		expect(response.status).toBe(404);
	});

	it('returns a 502 with an error body when the upstream fetch fails', async () => {
		vi.mocked(fetchMonthInProgress).mockRejectedValue(new Error('Open-Meteo error: 429'));

		const response = await GET({} as unknown as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	it('does not call the upstream again while a recent failure is cached', async () => {
		vi.mocked(fetchMonthInProgress).mockRejectedValue(new Error('Open-Meteo error: 429'));
		await GET({} as unknown as Parameters<typeof GET>[0]);

		vi.mocked(fetchMonthInProgress).mockClear();
		const response = await GET({} as unknown as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		expect(fetchMonthInProgress).not.toHaveBeenCalled();
	});
});
