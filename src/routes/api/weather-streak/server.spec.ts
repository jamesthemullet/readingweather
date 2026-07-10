import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeatherStreakResult } from '$lib/api/weatherStreak';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

const mockStreak: WeatherStreakResult = {
	active: {
		type: 'dry',
		emoji: '☀️',
		length: 14,
		headline: '14 consecutive dry days in Reading',
		context: 'the longest since 2022'
	},
	secondary: [],
	asOf: '9 July 2026'
};

vi.mock('$lib/api/weatherStreak', () => ({
	fetchWeatherStreak: vi.fn()
}));

import { fetchWeatherStreak } from '$lib/api/weatherStreak';
import { GET } from './+server';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('GET /api/weather-streak', () => {
	it('returns 200 with the streak data', async () => {
		vi.mocked(fetchWeatherStreak).mockResolvedValue(mockStreak);

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.active.headline).toBe('14 consecutive dry days in Reading');
	});

	it('returns 200 with null when no streak is currently active', async () => {
		vi.mocked(fetchWeatherStreak).mockResolvedValue(null);

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toBeNull();
	});

	it('returns a 502 with an error body when the upstream fetch fails', async () => {
		vi.mocked(fetchWeatherStreak).mockRejectedValue(new Error('Open-Meteo error: 429'));

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	it('does not call the upstream again while a recent failure is cached', async () => {
		vi.mocked(fetchWeatherStreak).mockRejectedValue(new Error('Open-Meteo error: 429'));
		await GET({} as Parameters<typeof GET>[0]);

		vi.mocked(fetchWeatherStreak).mockClear();
		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		expect(fetchWeatherStreak).not.toHaveBeenCalled();
	});

	it('does not call the upstream again once a null result is cached', async () => {
		vi.mocked(fetchWeatherStreak).mockResolvedValue(null);
		await GET({} as Parameters<typeof GET>[0]);

		vi.mocked(fetchWeatherStreak).mockClear();
		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toBeNull();
		expect(fetchWeatherStreak).not.toHaveBeenCalled();
	});
});
