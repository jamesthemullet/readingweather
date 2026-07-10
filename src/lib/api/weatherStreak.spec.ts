import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeatherStreak } from './weatherStreak';

// Fixed "now" so the fetch window always ends yesterday, 2026-07-09.
const NOW = new Date('2026-07-10T12:00:00Z');

function dateRange(start: string, end: string): string[] {
	const dates: string[] = [];
	const d = new Date(`${start}T00:00:00Z`);
	const endDate = new Date(`${end}T00:00:00Z`);
	while (d <= endDate) {
		dates.push(d.toISOString().slice(0, 10));
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return dates;
}

function makeArchiveResponse(time: string[], overrides: Partial<Record<string, number[]>> = {}) {
	const n = time.length;
	return {
		ok: true,
		json: async () => ({
			daily: {
				time,
				temperature_2m_max: overrides.temperature_2m_max ?? Array(n).fill(15),
				temperature_2m_min: overrides.temperature_2m_min ?? Array(n).fill(8),
				precipitation_sum: overrides.precipitation_sum ?? Array(n).fill(2),
				sunshine_duration: overrides.sunshine_duration ?? Array(n).fill(0),
				daylight_duration: overrides.daylight_duration ?? Array(n).fill(50000)
			}
		})
	};
}

describe('fetchWeatherStreak', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('requests a single continuous range ending yesterday, HISTORY_YEARS back', async () => {
		const time = dateRange('2016-07-10', '2026-07-09');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeArchiveResponse(time)));

		await fetchWeatherStreak(NOW);
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('start_date')).toBe('2016-07-09');
		expect(params.get('end_date')).toBe('2026-07-09');
	});

	it('detects a current dry streak ending on the last day and reports its length', async () => {
		const time = dateRange('2026-06-01', '2026-07-09');
		const precipitation_sum = time.map((_, i) => (i < time.length - 5 ? 5 : 0));
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(time, { precipitation_sum }))
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result?.active.type).toBe('dry');
		expect(result?.active.length).toBe(5);
	});

	it('returns null when no streak is currently active', async () => {
		const time = dateRange('2026-06-01', '2026-07-09');
		// The final day (index length-1, i.e. "yesterday") sits in the gap between the
		// dry and wet thresholds and is otherwise unremarkable, so no run reaches it.
		const precipitation_sum = time.map((_, i) => (i === time.length - 1 ? 0.7 : 5));
		const temperature_2m_max = time.map((_, i) => (i === time.length - 1 ? 10 : 15));
		const temperature_2m_min = time.map((_, i) => (i === time.length - 1 ? 3 : 8));
		const sunshine_duration = time.map(() => 0);
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					makeArchiveResponse(time, {
						precipitation_sum,
						temperature_2m_max,
						temperature_2m_min,
						sunshine_duration
					})
				)
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result).toBeNull();
	});

	it('picks the longest active streak as the primary and lists the rest as secondary', async () => {
		const time = dateRange('2026-06-01', '2026-07-09');
		// Last 3 days are dry AND frosty; make the dry streak longer by starting it earlier.
		const precipitation_sum = time.map((_, i) => (i < time.length - 6 ? 5 : 0));
		const temperature_2m_min = time.map((_, i) => (i < time.length - 3 ? 8 : -1));
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(makeArchiveResponse(time, { precipitation_sum, temperature_2m_min }))
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result?.active.type).toBe('dry');
		expect(result?.active.length).toBe(6);
		expect(result?.secondary.some((s) => s.type === 'frost')).toBe(true);
	});

	it('reports "the longest in at least N years" when nothing that long occurred before', async () => {
		const time = dateRange('2016-07-10', '2026-07-09');
		const precipitation_sum = time.map((_, i) => (i < time.length - 10 ? 5 : 0));
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(time, { precipitation_sum }))
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result?.active.context).toBe('the longest in at least 10 years of records');
	});

	it('reports "the longest since <year>" when an earlier equal-or-longer streak is found', async () => {
		const time = dateRange('2016-07-10', '2026-07-09');
		const precipitation_sum = Array(time.length).fill(5);
		// A long dry spell in 2020, then the current 4-day streak ending "yesterday".
		const idx2020Start = time.indexOf('2020-08-01');
		for (let i = idx2020Start; i < idx2020Start + 8; i++) precipitation_sum[i] = 0;
		for (let i = time.length - 4; i < time.length; i++) precipitation_sum[i] = 0;

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(time, { precipitation_sum }))
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result?.active.type).toBe('dry');
		expect(result?.active.context).toBe('the longest since 2020');
	});

	it('judges "sunny" by the share of daylight hours, not an absolute hour count', async () => {
		const time = dateRange('2026-06-01', '2026-07-09');
		// Midsummer day length here is ~16h (57600s). A day with 10h of sunshine is
		// genuinely sunny (63% of daylight); one with 8h is mostly overcast (50%),
		// even though both would have cleared a naive flat "> 6 hours" threshold.
		const daylight_duration = time.map(() => 57600);
		const sunshine_duration = time.map((_, i) => (i === time.length - 2 ? 8 * 3600 : 10 * 3600));
		// Keep precipitation in the gap between the dry/wet thresholds so those
		// streaks stay inactive and don't outrank the sunny streak under test.
		const precipitation_sum = time.map(() => 0.7);

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					makeArchiveResponse(time, { sunshine_duration, daylight_duration, precipitation_sum })
				)
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result?.active.type).toBe('sunny');
		// Streak resets on the overcast day two days ago, so only "yesterday" counts.
		expect(result?.active.length).toBe(1);
	});

	it('reports "the longest so far this year" instead of naming the current year', async () => {
		const time = dateRange('2016-07-10', '2026-07-09');
		const precipitation_sum = Array(time.length).fill(5);
		// An earlier 5-day dry spell in March 2026, then the current 5-day streak
		// ending "yesterday" — both fall within the same year as NOW.
		const idxMarchStart = time.indexOf('2026-03-01');
		for (let i = idxMarchStart; i < idxMarchStart + 5; i++) precipitation_sum[i] = 0;
		for (let i = time.length - 5; i < time.length; i++) precipitation_sum[i] = 0;

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(time, { precipitation_sum }))
		);

		const result = await fetchWeatherStreak(NOW);
		expect(result?.active.type).toBe('dry');
		expect(result?.active.context).toBe('the longest so far this year');
	});

	it('throws when the API request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
		await expect(fetchWeatherStreak(NOW)).rejects.toThrow('Open-Meteo error: 500');
	});
});
