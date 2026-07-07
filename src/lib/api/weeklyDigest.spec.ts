import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWeeklyDigest } from './weeklyDigest';

function makeArchiveResponse(sunshineDuration: number[], daylightDuration: number[]) {
	return {
		ok: true,
		json: async () => ({
			daily: {
				time: [
					'2026-06-15',
					'2026-06-16',
					'2026-06-17',
					'2026-06-18',
					'2026-06-19',
					'2026-06-20',
					'2026-06-21'
				],
				temperature_2m_max: [18.2, 19.456, 21.1, 20.0, 17.8, 22.3, 19.9],
				temperature_2m_min: [10.1, 9.789, 11.2, 12.456, 8.5, 13.1, 10.0],
				precipitation_sum: [0, 2.456, 0, 5.1, 0, 0.5, 0],
				sunshine_duration: sunshineDuration,
				daylight_duration: daylightDuration
			}
		})
	};
}

// ~81% of daylight hours had sunshine, matching a genuinely sunny week.
const mostlySunnyWeek = {
	sunshine: [57600, 54162.96, 48444.29, 31750.93, 47883.58, 55042.73, 43200],
	daylight: [59760.44, 59727.91, 59689.64, 59645.67, 59596.03, 59540.67, 59479.05]
};

describe('fetchWeeklyDigest', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(makeArchiveResponse(mostlySunnyWeek.sunshine, mostlySunnyWeek.daylight))
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns the highest max and lowest min temperature, rounded to one decimal', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.tempHigh).toBe(22.3);
		expect(digest.tempLow).toBe(8.5);
	});

	it('sums precipitation across the window, rounded to one decimal', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.totalPrecipitation).toBe(8.1);
	});

	it('counts days with at least 1mm of rain as rainy days and names them', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.rainyDays).toBe(2);
		expect(digest.rainyDayNames).toEqual(['Tuesday', 'Thursday']);
	});

	it('returns no rainy day names when no day reached 1mm of rain', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					daily: {
						time: [
							'2026-06-15',
							'2026-06-16',
							'2026-06-17',
							'2026-06-18',
							'2026-06-19',
							'2026-06-20',
							'2026-06-21'
						],
						temperature_2m_max: [18.2, 19.5, 21.1, 20.0, 17.8, 22.3, 19.9],
						temperature_2m_min: [10.1, 9.8, 11.2, 12.5, 8.5, 13.1, 10.0],
						precipitation_sum: [0, 0.4, 0, 0.9, 0, 0, 0],
						sunshine_duration: mostlySunnyWeek.sunshine,
						daylight_duration: mostlySunnyWeek.daylight
					}
				})
			})
		);
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.rainyDays).toBe(0);
		expect(digest.rainyDayNames).toEqual([]);
	});

	it('identifies the sunniest and cloudiest day of the week by sunshine-to-daylight ratio', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.sunniestDay).toEqual({ day: 'Monday', sunshineHours: 16 });
		expect(digest.cloudiestDay).toEqual({ day: 'Thursday', sunshineHours: 8.8 });
	});

	it('describes a week with high sunshine-to-daylight ratio as mostly sunny', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.dominantConditions).toBe('mostly sunny');
	});

	it('describes a week with low sunshine-to-daylight ratio as mostly overcast', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				makeArchiveResponse(
					[0, 0, 0, 0, 0, 0, 0],
					[59760, 59727, 59689, 59645, 59596, 59540, 59479]
				)
			)
		);
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.dominantConditions).toBe('mostly overcast');
	});

	it('describes a week with a middling sunshine-to-daylight ratio as a mix of sun and cloud', async () => {
		const halfSunshine = mostlySunnyWeek.daylight.map((d) => d * 0.5);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(halfSunshine, mostlySunnyWeek.daylight))
		);
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.dominantConditions).toBe('a mix of sun and cloud');
	});

	it('describes a week with roughly a quarter of daylight hours as sunshine as mostly cloudy', async () => {
		const quarterSunshine = mostlySunnyWeek.daylight.map((d) => d * 0.25);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(quarterSunshine, mostlySunnyWeek.daylight))
		);
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.dominantConditions).toBe('mostly cloudy');
	});

	it('describes a week with zero daylight duration as unsettled', async () => {
		const zeroDaylight = [0, 0, 0, 0, 0, 0, 0];
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(makeArchiveResponse(zeroDaylight, zeroDaylight))
		);
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.dominantConditions).toBe('unsettled');
	});

	it('ends the window yesterday to account for ERA5 data lag on the current day', async () => {
		await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('end_date')).toBe('2026-06-24');
		expect(params.get('start_date')).toBe('2026-06-18');
	});

	it('throws when the API request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
		await expect(fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'))).rejects.toThrow(
			'Open-Meteo error: 500'
		);
	});

	it('passes an abort signal so a slow upstream response fails fast', async () => {
		await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
		expect(options.signal).toBeInstanceOf(AbortSignal);
	});
});
