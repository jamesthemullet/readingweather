import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

import { fetchMonthlySummary } from './monthlySummary';

// "Now" is set well into July so June 2026 is a fully completed month.
const NOW = new Date('2026-07-15T12:00:00Z');

function juneDates(year: number): string[] {
	const days = new Date(Date.UTC(year, 6, 0)).getUTCDate();
	return Array.from(
		{ length: days },
		(_, i) => `${year}-06-${String(i + 1).padStart(2, '0')}`
	);
}

// Only a handful of years have data — the rest of the 1940-2026 range is simply
// absent from the response, which fetchMonthlySummary should skip over silently.
function makeArchiveResponse() {
	const years = [1962, 1971, 2020, 2026];
	const time = years.flatMap(juneDates);

	function fill(year: number, value: number, hotDayValue?: number) {
		const days = juneDates(year).length;
		const arr = new Array(days).fill(value);
		if (hotDayValue !== undefined) arr[19] = hotDayValue; // 20th of June
		return arr;
	}

	const temperature_2m_max = [
		...fill(1962, 18.0),
		...fill(1971, 19.0),
		...fill(2020, 20.0),
		...fill(2026, 22.0, 32.1) // 2026 has the all-time hottest day
	];
	const temperature_2m_min = [
		...fill(1962, 8.0, 1.2), // 1962 has the all-time coldest day
		...fill(1971, 9.0),
		...fill(2020, 10.0),
		...fill(2026, 9.2)
	];
	const temperature_2m_mean = [
		...fill(1962, 13.0),
		...fill(1971, 14.0),
		...fill(2020, 20.0), // 2020 is the warmest June on record by mean temp
		...fill(2026, 17.1)
	];
	const precipitation_sum = [
		...fill(1962, 1.0),
		...fill(1971, 1.0, 40.5), // 1971 has the all-time wettest day
		...fill(2020, 1.0),
		...fill(2026, 1.0, 18.2)
	];
	const sunshine_duration = [
		...fill(1962, 5 * 3600),
		...fill(1971, 5 * 3600),
		...fill(2020, 5 * 3600),
		...fill(2026, 5 * 3600, 14.8 * 3600)
	];
	// 2026 is mostly "cloudy" (code 3), aside from the 20th (code 61, "light rain").
	const weather_code = [
		...fill(1962, 3),
		...fill(1971, 3),
		...fill(2020, 3),
		...years
			.filter((y) => y === 2026)
			.flatMap((y) => {
				const codes = new Array(juneDates(y).length).fill(3);
				codes[19] = 61;
				return codes;
			})
	];

	return {
		ok: true,
		json: async () => ({
			daily: {
				time,
				temperature_2m_max,
				temperature_2m_min,
				temperature_2m_mean,
				precipitation_sum,
				sunshine_duration,
				weather_code
			}
		})
	};
}

describe('fetchMonthlySummary', () => {
	beforeEach(() => {
		cacheStore.clear();
		vi.useFakeTimers();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeArchiveResponse()));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('throws when the requested month has not yet fully completed', async () => {
		await expect(fetchMonthlySummary(2026, 7, NOW)).rejects.toThrow(
			'Monthly summary is only available for fully completed months'
		);
	});

	it('requests a single continuous range from 1940 through the last complete year for this month', async () => {
		await fetchMonthlySummary(2026, 6, NOW);
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('start_date')).toBe('1940-06-01');
		expect(params.get('end_date')).toBe('2026-06-30');
	});

	it('reuses the cached historical baseline across different years of the same month, without refetching', async () => {
		await fetchMonthlySummary(2026, 6, NOW);
		expect(fetch).toHaveBeenCalledTimes(1);

		const summary2020 = await fetchMonthlySummary(2020, 6, NOW);

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(summary2020.temperature.mean).toBe(20.0);
		expect(summary2020.temperatureRank).toBe(1);
	});

	it('reports the requested year’s high, low and mean temperature', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.temperature.high).toBe(32.1);
		expect(summary.temperature.low).toBe(9.2);
		expect(summary.temperature.mean).toBe(17.1);
	});

	it('ranks the requested year by mean temperature against all other years', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		// 2020 (mean 20.0) > 2026 (mean 17.1) > 1971 (14.0) > 1962 (13.0)
		expect(summary.temperatureRank).toBe(2);
		expect(summary.headline).toBe('June 2026 was the 2nd warmest June in Reading since 1940');
	});

	it('finds the all-time hottest, coldest and wettest days across the dataset', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.records.hottestDay).toEqual({ date: '2026-06-20', year: 2026, value: 32.1 });
		expect(summary.records.coldestDay).toEqual({ date: '1962-06-20', year: 1962, value: 1.2 });
		expect(summary.records.wettestDay).toEqual({ date: '1971-06-20', year: 1971, value: 40.5 });
	});

	it('finds the wettest and sunniest day within the requested month specifically', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.rainfall.wettestDay).toEqual({ date: '2026-06-20', value: 18.2 });
		expect(summary.sunshine.sunniestDay).toEqual({ date: '2026-06-20', hours: 14.8 });
	});

	it('counts years of data present in the response', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.yearsOfData).toBe(4);
	});

	it('throws when the API request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
		await expect(fetchMonthlySummary(2026, 6, NOW)).rejects.toThrow('Open-Meteo error: 500');
	});

	it('retries after a 429 and succeeds once the upstream stops rate-limiting', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers() })
			.mockResolvedValueOnce(makeArchiveResponse());
		vi.stubGlobal('fetch', mockFetch);

		const summaryPromise = fetchMonthlySummary(2026, 6, NOW);
		await vi.runAllTimersAsync();
		const summary = await summaryPromise;

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(summary.temperature.high).toBe(32.1);
	});

	it('honours a Retry-After header when backing off a 429', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 429,
				headers: new Headers({ 'retry-after': '2' })
			})
			.mockResolvedValueOnce(makeArchiveResponse());
		vi.stubGlobal('fetch', mockFetch);

		const summaryPromise = fetchMonthlySummary(2026, 6, NOW);
		await vi.advanceTimersByTimeAsync(1000);
		expect(mockFetch).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1000);
		await summaryPromise;

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('gives up after repeated 429s and surfaces the error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, status: 429, headers: new Headers() })
		);

		const summaryPromise = fetchMonthlySummary(2026, 6, NOW);
		const assertion = expect(summaryPromise).rejects.toThrow('Open-Meteo error: 429');
		await vi.runAllTimersAsync();
		await assertion;
	});

	it('throws with a descriptive message when the archive response contains no data for the month', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					daily: {
						time: [],
						temperature_2m_max: [],
						temperature_2m_min: [],
						temperature_2m_mean: [],
						precipitation_sum: [],
						sunshine_duration: []
					}
				})
			})
		);
		await expect(fetchMonthlySummary(2026, 6, NOW)).rejects.toThrow(
			'No historical data available for this month'
		);
	});

	it('reports the dominant weather condition for the requested month', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.condition).toEqual({ category: 'cloudy', label: 'cloudy' });
	});

	it('falls back to a null condition when the archive response has no weather codes', async () => {
		const { weather_code: _weather_code, ...dailyWithoutCodes } = (
			await makeArchiveResponse().json()
		).daily;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, json: async () => ({ daily: dailyWithoutCodes }) })
		);

		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.condition).toBeNull();
	});

	it('finds the longest run of consecutive days meeting a streak threshold within the month', async () => {
		const summary = await fetchMonthlySummary(2026, 6, NOW);
		// Every day in June 2026 has at least 1mm of rain in the fixture, so the
		// whole month qualifies as one long "wet" streak.
		expect(summary.streak).toEqual({
			type: 'wet',
			emoji: '🌧️',
			length: 30,
			label: '30 consecutive days of rain'
		});
	});

	it('uses a rainfall headline instead of the temperature ranking when rainfall is far from average', async () => {
		const years = [1962, 1971, 2020, 2026];
		const time = years.flatMap(juneDates);

		function fill(year: number, value: number) {
			return new Array(juneDates(year).length).fill(value);
		}

		const flat = (value: number) => years.flatMap((y) => fill(y, value));

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					daily: {
						time,
						temperature_2m_max: flat(20),
						temperature_2m_min: flat(10),
						temperature_2m_mean: flat(15),
						// 2026 gets 4x the rain of every other year on record.
						precipitation_sum: [
							...fill(1962, 1.0),
							...fill(1971, 1.0),
							...fill(2020, 1.0),
							...fill(2026, 4.0)
						],
						sunshine_duration: flat(5 * 3600)
					}
				})
			})
		);

		const summary = await fetchMonthlySummary(2026, 6, NOW);
		expect(summary.headline).toBe(
			'June 2026 was an unusually wet month in Reading — 2.3× the typical June rainfall'
		);
	});
});
