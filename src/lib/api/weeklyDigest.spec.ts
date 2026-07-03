import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWeeklyDigest } from './weeklyDigest';

function makeArchiveResponse() {
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
				weather_code: [2, 61, 2, 63, 1, 2, 2]
			}
		})
	};
}

describe('fetchWeeklyDigest', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeArchiveResponse()));
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

	it('counts days with at least 1mm of rain as rainy days', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.rainyDays).toBe(2);
	});

	it('picks the most frequent weather code as the dominant condition', async () => {
		const digest = await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		expect(digest.dominantConditions).toBe('partly cloudy');
	});

	it('ends the window a few days before today to account for ERA5 data lag', async () => {
		await fetchWeeklyDigest(new Date('2026-06-25T12:00:00Z'));
		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		const params = new URL(calledUrl).searchParams;
		expect(params.get('end_date')).toBe('2026-06-22');
		expect(params.get('start_date')).toBe('2026-06-16');
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
