import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

const mockDigest = {
	startDate: '2026-06-16',
	endDate: '2026-06-22',
	tempHigh: 22.3,
	tempLow: 8.5,
	totalPrecipitation: 8.1,
	rainyDays: 2,
	rainyDayNames: ['Tuesday', 'Thursday'],
	sunniestDay: { day: 'Saturday', sunshineHours: 12.4 },
	cloudiestDay: { day: 'Sunday', sunshineHours: 1.2 },
	dominantConditions: 'partly cloudy'
};

vi.mock('$lib/api/weeklyDigest', () => ({
	fetchWeeklyDigest: vi.fn()
}));

import { fetchWeeklyDigest } from '$lib/api/weeklyDigest';
import { GET } from './+server';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('GET /api/weekly-digest', () => {
	it('returns 200 with the weekly digest', async () => {
		vi.mocked(fetchWeeklyDigest).mockResolvedValue(mockDigest);

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.dominantConditions).toBe('partly cloudy');
		expect(body.totalPrecipitation).toBe(8.1);
	});

	it('returns a 502 with an error body when the upstream fetch fails', async () => {
		vi.mocked(fetchWeeklyDigest).mockRejectedValue(new Error('Open-Meteo error: 429'));

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	it('does not call the upstream again while a recent failure is cached', async () => {
		vi.mocked(fetchWeeklyDigest).mockRejectedValue(new Error('Open-Meteo error: 429'));
		await GET({} as Parameters<typeof GET>[0]);

		vi.mocked(fetchWeeklyDigest).mockClear();
		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		expect(fetchWeeklyDigest).not.toHaveBeenCalled();
	});
});
