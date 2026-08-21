import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRecordsTracker } from './recordsTracker';

// "Now" is 2026-08-21, so data runs through 2026-08-20 (yesterday).
const NOW = new Date('2026-08-21T09:00:00Z');

function janDates(year: number): string[] {
	return Array.from({ length: 31 }, (_, i) => `${year}-01-${String(i + 1).padStart(2, '0')}`);
}

function augDates(year: number, throughDay = 31): string[] {
	return Array.from({ length: throughDay }, (_, i) => `${year}-08-${String(i + 1).padStart(2, '0')}`);
}

// Two calendar months across three years: a fully-elapsed January and a
// partially-elapsed August (2026 only runs to the 20th, matching "yesterday").
function makeArchiveResponse() {
	const time = [
		...janDates(1962),
		...janDates(1990),
		...janDates(2026),
		...augDates(1962),
		...augDates(1990),
		...augDates(2026, 20)
	];

	const tempMax = new Array(time.length).fill(8.0);
	const tempMin = new Array(time.length).fill(1.0);
	const precip = new Array(time.length).fill(0);
	const sunshine = new Array(time.length).fill(5 * 3600);

	const idx = (dateStr: string) => time.indexOf(dateStr);

	// August baseline: 1962 and 1990 both have ordinary summer days, with 1990
	// holding the existing wettest-August-day record.
	for (const dateStr of augDates(1962)) tempMax[idx(dateStr)] = 24.0;
	for (const dateStr of augDates(1990)) tempMax[idx(dateStr)] = 25.0;
	for (const dateStr of augDates(2026, 20)) tempMax[idx(dateStr)] = 23.0;
	for (const dateStr of [...augDates(1962), ...augDates(1990), ...augDates(2026, 20)]) {
		precip[idx(dateStr)] = 5.0;
	}
	precip[idx('1990-08-01')] = 38.6;

	// August 2026 sets a new hottest-day record on the 12th, and lands a
	// near-miss (2nd wettest) on the 3rd, below 1990's 38.6mm record.
	tempMax[idx('2026-08-12')] = 34.2;
	precip[idx('2026-08-03')] = 30.1;

	// January: 2026 sets a new coldest-night record on the 10th.
	for (const dateStr of janDates(1990)) tempMin[idx(dateStr)] = 0.5;
	for (const dateStr of janDates(2026)) tempMin[idx(dateStr)] = 2.0;
	tempMin[idx('2026-01-10')] = -8.2;

	return {
		ok: true,
		json: async () => ({
			daily: {
				time,
				temperature_2m_max: tempMax,
				temperature_2m_min: tempMin,
				precipitation_sum: precip,
				sunshine_duration: sunshine
			}
		})
	};
}

describe('fetchRecordsTracker', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeArchiveResponse()));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('requests a single continuous range from 1940 through yesterday', async () => {
		await fetchRecordsTracker(NOW);
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('start_date')).toBe('1940-01-01');
		expect(params.get('end_date')).toBe('2026-08-20');
	});

	it('reports the current year and how many years of data back it to 1940', async () => {
		const result = await fetchRecordsTracker(NOW);
		expect(result.year).toBe(2026);
		expect(result.yearsOfData).toBe(2026 - 1940 + 1);
	});

	it('reports the raw ISO date of the last day of data, alongside the display string', async () => {
		const result = await fetchRecordsTracker(NOW);
		expect(result.asOfDate).toBe('2026-08-20');
		expect(result.asOf).toBe('20 August 2026');
	});

	it('detects a broken record for the current year against the calendar-month baseline', async () => {
		const result = await fetchRecordsTracker(NOW);
		const hottest = result.brokenRecords.find((r) => r.metric === 'hottest');
		expect(hottest).toEqual({
			date: '2026-08-12',
			metric: 'hottest',
			emoji: '🌡️',
			label: 'Hottest August day',
			value: 34.2,
			unit: '°C',
			previousValue: 25.0,
			previousDate: '1990-08-01'
		});
	});

	it('detects a broken record on a different calendar month using its own baseline', async () => {
		const result = await fetchRecordsTracker(NOW);
		const coldest = result.brokenRecords.find((r) => r.metric === 'coldest');
		expect(coldest).toEqual({
			date: '2026-01-10',
			metric: 'coldest',
			emoji: '❄️',
			label: 'Coldest January night',
			value: -8.2,
			unit: '°C',
			previousValue: 0.5,
			previousDate: '1990-01-01'
		});
	});

	it('surfaces a top-10 near miss that did not break the record', async () => {
		const result = await fetchRecordsTracker(NOW);
		const nearMiss = result.nearMisses.find((r) => r.metric === 'wettest');
		expect(nearMiss).toEqual({
			date: '2026-08-03',
			metric: 'wettest',
			emoji: '🌧️',
			label: 'Wettest August day',
			value: 30.1,
			unit: 'mm',
			rank: 2,
			recordValue: 38.6,
			recordDate: '1990-08-01'
		});
	});

	it('does not report a near miss for a metric the current year never came close on', async () => {
		const result = await fetchRecordsTracker(NOW);
		expect(result.nearMisses.some((r) => r.metric === 'sunniest')).toBe(false);
	});

	it('reports the all-time extreme for each metric across the whole dataset', async () => {
		const result = await fetchRecordsTracker(NOW);
		const hottestEver = result.allTimeRecords.find((r) => r.metric === 'hottest');
		expect(hottestEver).toEqual({
			metric: 'hottest',
			emoji: '🌡️',
			label: 'Hottest day on record',
			value: 34.2,
			unit: '°C',
			date: '2026-08-12'
		});
	});

	it('orders broken records and near misses most-recent first', async () => {
		const result = await fetchRecordsTracker(NOW);
		const dates = result.brokenRecords.map((r) => r.date);
		expect(dates).toEqual([...dates].sort().reverse());
	});

	it('throws when the API request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
		await expect(fetchRecordsTracker(NOW)).rejects.toThrow('Open-Meteo error: 500');
	});

	it('retries after a 429 and succeeds once the upstream stops rate-limiting', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers() })
			.mockResolvedValueOnce(makeArchiveResponse());
		vi.stubGlobal('fetch', mockFetch);

		const resultPromise = fetchRecordsTracker(NOW);
		await vi.runAllTimersAsync();
		const result = await resultPromise;

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(result.year).toBe(2026);
	});

	it('throws with a descriptive message when the archive response has no data', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					daily: {
						time: [],
						temperature_2m_max: [],
						temperature_2m_min: [],
						precipitation_sum: [],
						sunshine_duration: []
					}
				})
			})
		);
		await expect(fetchRecordsTracker(NOW)).rejects.toThrow('No historical data available');
	});
});
