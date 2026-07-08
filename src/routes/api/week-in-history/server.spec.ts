import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

const mockHistory = {
	windowLabel: '18 June – 24 June',
	yearsOfData: 86,
	hottestDay: { year: 2003, value: 31.5 },
	coldestDay: { year: 2020, value: 1.0 },
	wettestWeek: { year: 2020, value: 29 }
};

vi.mock('$lib/api/weekInHistory', () => ({
	fetchWeekInHistory: vi.fn()
}));

import { fetchWeekInHistory } from '$lib/api/weekInHistory';
import { GET } from './+server';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('GET /api/week-in-history', () => {
	it('returns 200 with the week-in-history data', async () => {
		vi.mocked(fetchWeekInHistory).mockResolvedValue(mockHistory);

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.hottestDay).toEqual({ year: 2003, value: 31.5 });
		expect(body.yearsOfData).toBe(86);
	});

	it('returns a 502 with an error body when the upstream fetch fails', async () => {
		vi.mocked(fetchWeekInHistory).mockRejectedValue(new Error('Open-Meteo error: 429'));

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	it('does not call the upstream again while a recent failure is cached', async () => {
		vi.mocked(fetchWeekInHistory).mockRejectedValue(new Error('Open-Meteo error: 429'));
		await GET({} as Parameters<typeof GET>[0]);

		vi.mocked(fetchWeekInHistory).mockClear();
		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		expect(fetchWeekInHistory).not.toHaveBeenCalled();
	});
});
