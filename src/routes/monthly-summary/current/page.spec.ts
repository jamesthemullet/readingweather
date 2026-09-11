import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { load as loadType } from './+page.server';

type LoadResult = Exclude<Awaited<ReturnType<typeof loadType>>, void>;

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
import { load } from './+page.server';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
});

describe('/monthly-summary/current load', () => {
	it('returns the month-in-progress data', async () => {
		vi.mocked(fetchMonthInProgress).mockResolvedValue(mockProgress);

		const result = (await load({} as unknown as Parameters<typeof load>[0])) as LoadResult;

		expect(result.progress.label).toBe('August 2026');
		expect(result.progress.rainfall.projectedRankLabel).toBe('1st wettest');
	});

	it('redirects to last month’s completed report card when there is not enough data yet', async () => {
		vi.mocked(fetchMonthInProgress).mockRejectedValue(
			new Error('Not enough data available yet for the current month')
		);

		await expect(load({} as unknown as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 307,
			location: '/monthly-summary/2026/07'
		});
	});

	it('throws a 503 when the upstream fetch fails for another reason', async () => {
		vi.mocked(fetchMonthInProgress).mockRejectedValue(new Error('Open-Meteo error: 500'));

		await expect(load({} as unknown as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 503
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});
});
