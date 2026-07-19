import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWeekInHistory } from './weekInHistory';

// Fixed "now" so the digest window is always 2026-06-18 to 2026-06-24
// (end = yesterday, start = end - 6 days).
const NOW = new Date('2026-06-25T12:00:00Z');

function weekDates(year: number): string[] {
	return [
		`${year}-06-18`,
		`${year}-06-19`,
		`${year}-06-20`,
		`${year}-06-21`,
		`${year}-06-22`,
		`${year}-06-23`,
		`${year}-06-24`
	];
}

// Only a handful of years have data — the rest of the 1940-2026 range is simply
// absent from the response, which fetchWeekInHistory should skip over silently.
// 2026 is "this year" relative to NOW and must be included, not excluded.
function makeArchiveResponse() {
	const years = [1976, 2003, 2020, 2026];
	const time = years.flatMap(weekDates);
	const temperature_2m_max = [
		...[24.1, 25.6, 27.891, 26.0, 23.5, 22.1, 21.0], // 1976
		...[30.234, 31.5, 29.876, 28.0, 27.5, 26.1, 25.0], // 2003
		...[19.1, 20.5, 21.891, 20.0, 18.5, 17.1, 16.0], // 2020
		...[32.234, 34.6, 32.3, 29.3, 24.4, 21.3, 22.8] // 2026 — hottest
	];
	const temperature_2m_min = [
		...[14.1, 13.6, 12.891, 11.0, 10.5, 9.1, 8.0], // 1976
		...[18.234, 17.5, 16.876, 15.0, 14.5, 13.1, 12.0], // 2003
		...[7.1, 6.234, 5.891, 4.0, 3.5, 2.1, 1.0], // 2020 — coldest
		...[19.1, 21.1, 23.1, 19.3, 16.7, 12.8, 15.1] // 2026
	];
	const precipitation_sum = [
		...[0, 0.5, 0, 1.234, 0, 0, 0.1], // 1976
		...[0, 0, 0, 0, 0, 0, 0], // 2003
		...[5.5, 8.234, 12.1, 0, 3.2, 0, 0], // 2020 — wettest
		...[0, 0, 0, 0.2, 0.3, 0, 0.2] // 2026
	];

	return {
		ok: true,
		json: async () => ({
			daily: { time, temperature_2m_max, temperature_2m_min, precipitation_sum }
		})
	};
}

describe('fetchWeekInHistory', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeArchiveResponse()));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('finds the hottest day and year for the window, rounded to one decimal', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.hottestDay).toEqual({ year: 2026, value: 34.6 });
	});

	it('finds the coldest day and year for the window, rounded to one decimal', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.coldestDay).toEqual({ year: 2020, value: 1.0 });
	});

	it('finds the wettest week by total precipitation across the window', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.wettestWeek).toEqual({ year: 2020, value: 29 });
	});

	it('includes the current year, since the window already ends yesterday', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.hottestDay.year).toBe(2026);
	});

	it('labels the window as this year’s matching date range', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.windowLabel).toBe('18 June – 24 June');
	});

	it('counts years of data back to 1940 up to and including this year', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.yearsOfData).toBe(2026 - 1940 + 1);
	});

	it('requests a single continuous range from 1940 through this year', async () => {
		await fetchWeekInHistory(NOW);
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('start_date')).toBe('1940-06-18');
		expect(params.get('end_date')).toBe('2026-06-24');
	});

	it('passes an abort signal so a slow upstream response fails fast', async () => {
		await fetchWeekInHistory(NOW);
		const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
		expect(options.signal).toBeInstanceOf(AbortSignal);
	});

	it('throws when the API request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
		await expect(fetchWeekInHistory(NOW)).rejects.toThrow('Open-Meteo error: 500');
	});

	it('throws with a descriptive message when the archive response contains no dates in the window', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [] }
				})
			})
		);
		await expect(fetchWeekInHistory(NOW)).rejects.toThrow(
			'No historical data available for this window'
		);
	});
});
