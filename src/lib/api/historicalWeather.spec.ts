import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchHistoricalWeather } from './historicalWeather';

function makeWeatherResponse() {
	return {
		ok: true,
		json: async () => ({
			daily: {
				temperature_2m_max: [22.456],
				temperature_2m_min: [14.123],
				precipitation_sum: [3.789],
				wind_speed_10m_max: [18.321]
			},
			hourly: {
				// hours 00-05 (pre-morning), 06-11 (morning: partly cloudy=2),
				// 12-17 (afternoon: overcast=3), 18-23 (evening: mainly clear=1)
				weather_code: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1]
			}
		})
	};
}

describe('fetchHistoricalWeather', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeWeatherResponse()));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns exactly 6 years of data', async () => {
		const results = await fetchHistoricalWeather(6, 15);
		expect(results).toHaveLength(6);
	}, 3000);

	it('sorts results by year in descending order', async () => {
		const results = await fetchHistoricalWeather(1, 1);
		for (let i = 0; i < results.length - 1; i++) {
			expect(results[i].year).toBeGreaterThan(results[i + 1].year);
		}
	}, 3000);

	it('rounds temperature, precipitation, and wind speed to one decimal place', async () => {
		const [first] = await fetchHistoricalWeather(1, 1);
		// Math.round(22.456 * 10) / 10 = 22.5, etc.
		expect(first.tempMax).toBe(22.5);
		expect(first.tempMin).toBe(14.1);
		expect(first.precipitation).toBe(3.8);
		expect(first.windSpeedMax).toBe(18.3);
	}, 3000);

	it('silently omits years where the API request failed', async () => {
		let calls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation(async () => {
				calls++;
				if (calls === 1) return { ok: false, status: 500 };
				return makeWeatherResponse();
			})
		);
		const results = await fetchHistoricalWeather(1, 1);
		expect(results).toHaveLength(5);
	}, 3000);
});
