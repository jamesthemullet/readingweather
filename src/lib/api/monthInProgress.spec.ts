import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

import { fetchMonthInProgress } from './monthlySummary';

// "Now" is midway through August; with the 1-day data lag, 9 days of August have
// usable archive data (the 1st through the 9th).
const NOW = new Date('2026-08-10T12:00:00Z');

function augDates(year: number): string[] {
	const days = new Date(Date.UTC(year, 8, 0)).getUTCDate();
	return Array.from({ length: days }, (_, i) => `${year}-08-${String(i + 1).padStart(2, '0')}`);
}

// Four "quiet" historical years plus the target year, 2026, which is running much
// wetter than average so far but otherwise unremarkable on temperature and sunshine.
function makeArchiveResponse() {
	const historicalYears = [1962, 1971, 2020, 2025];
	const years = [...historicalYears, 2026];
	const time = years.flatMap(augDates);

	const flatFor = (year: number, value: number) => new Array(augDates(year).length).fill(value);

	return {
		ok: true,
		json: async () => ({
			daily: {
				time,
				temperature_2m_max: years.flatMap((y) => flatFor(y, 20)),
				temperature_2m_min: years.flatMap((y) => flatFor(y, 10)),
				temperature_2m_mean: years.flatMap((y) => flatFor(y, 20)),
				precipitation_sum: years.flatMap((y) => flatFor(y, y === 2026 ? 5.0 : 1.0)),
				sunshine_duration: years.flatMap((y) => flatFor(y, 5 * 3600))
			}
		})
	};
}

describe('fetchMonthInProgress', () => {
	beforeEach(() => {
		cacheStore.clear();
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeArchiveResponse()));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('throws when the data lag pushes the last available day into a different month', async () => {
		vi.setSystemTime(new Date('2026-08-01T06:00:00Z'));
		await expect(fetchMonthInProgress()).rejects.toThrow(
			'Not enough data available yet for the current month'
		);
	});

	it('reports how far through the month the data reaches', async () => {
		const progress = await fetchMonthInProgress(NOW);
		expect(progress.year).toBe(2026);
		expect(progress.month).toBe(8);
		expect(progress.daysElapsed).toBe(9);
		expect(progress.daysInMonth).toBe(31);
		expect(progress.daysRemaining).toBe(22);
		expect(progress.asOfDate).toBe('2026-08-09');
	});

	it('compares the month-to-date mean, total and sunshine against the historical month-to-date average', async () => {
		const progress = await fetchMonthInProgress(NOW);
		expect(progress.temperature.meanSoFar).toBe(20);
		expect(progress.temperature.historicalAverageMeanSoFar).toBe(20);
		expect(progress.rainfall.totalSoFar).toBe(45);
		expect(progress.rainfall.historicalAverageTotalSoFar).toBe(9);
		expect(progress.sunshine.totalHoursSoFar).toBe(45);
		expect(progress.sunshine.historicalAverageHoursSoFar).toBe(45);
	});

	it('projects the full month by carrying forward the month-to-date anomaly', async () => {
		const progress = await fetchMonthInProgress(NOW);
		// Historic full-month rain average is 31mm (1mm/day x 31 days); 2026 is
		// running 36mm above the historic month-to-date pace, so it's projected
		// to finish 36mm above the full-month average too.
		expect(progress.rainfall.projectedTotal).toBe(67);
		expect(progress.temperature.projectedMean).toBe(20);
		expect(progress.sunshine.projectedHours).toBe(155);
	});

	it('ranks the projected total among the historical full-month totals', async () => {
		const progress = await fetchMonthInProgress(NOW);
		expect(progress.rainfall.projectedRankLabel).toBe('1st wettest');
	});

	it('counts only the years with historical full-month data', async () => {
		const progress = await fetchMonthInProgress(NOW);
		expect(progress.yearsOfData).toBe(4);
	});

	it('builds a headline around the metric most out of line with its historic average', async () => {
		const progress = await fetchMonthInProgress(NOW);
		expect(progress.headline).toBe(
			'August 2026 is on track to be the 1st wettest August in Reading since 1940, with 22 days still to go'
		);
	});
});
