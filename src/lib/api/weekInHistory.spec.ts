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

// Only a handful of years have data — the rest of the 1940-2025 range is simply
// absent from the response, which fetchWeekInHistory should skip over silently.
function makeArchiveResponse() {
	const years = [1976, 2003, 2020];
	const time = years.flatMap(weekDates);
	const temperature_2m_max = [
		...[24.1, 25.6, 27.891, 26.0, 23.5, 22.1, 21.0], // 1976
		...[30.234, 31.5, 29.876, 28.0, 27.5, 26.1, 25.0], // 2003 — hottest
		...[19.1, 20.5, 21.891, 20.0, 18.5, 17.1, 16.0] // 2020
	];
	const temperature_2m_min = [
		...[14.1, 13.6, 12.891, 11.0, 10.5, 9.1, 8.0], // 1976
		...[18.234, 17.5, 16.876, 15.0, 14.5, 13.1, 12.0], // 2003
		...[7.1, 6.234, 5.891, 4.0, 3.5, 2.1, 1.0] // 2020 — coldest
	];
	const precipitation_sum = [
		...[0, 0.5, 0, 1.234, 0, 0, 0.1], // 1976
		...[0, 0, 0, 0, 0, 0, 0], // 2003
		...[5.5, 8.234, 12.1, 0, 3.2, 0, 0] // 2020 — wettest
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

	it('finds the hottest year and value for the window, rounded to one decimal', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.hottest).toEqual({ year: 2003, value: 31.5 });
	});

	it('finds the coldest year and value for the window, rounded to one decimal', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.coldest).toEqual({ year: 2020, value: 1.0 });
	});

	it('finds the wettest year by total precipitation across the window', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.wettest).toEqual({ year: 2020, value: 29 });
	});

	it('labels the window as this year’s matching date range', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.windowLabel).toBe('18 June – 24 June');
	});

	it('counts years of data back to 1940 up to the last complete year', async () => {
		const history = await fetchWeekInHistory(NOW);
		expect(history.yearsOfData).toBe(2025 - 1940 + 1);
	});

	it('requests a single continuous range from 1940 through last year', async () => {
		await fetchWeekInHistory(NOW);
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('start_date')).toBe('1940-06-18');
		expect(params.get('end_date')).toBe('2025-06-24');
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
});
