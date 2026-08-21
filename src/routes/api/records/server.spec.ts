import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordsTrackerResult } from '$lib/api/recordsTracker';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

const mockResult: RecordsTrackerResult = {
	year: 2026,
	asOf: '20 August 2026',
	asOfDate: '2026-08-20',
	yearsOfData: 87,
	brokenRecords: [
		{
			date: '2026-08-12',
			metric: 'hottest',
			emoji: '🌡️',
			label: 'Hottest August day',
			value: 34.2,
			unit: '°C',
			previousValue: 33.8,
			previousDate: '2006-07-19'
		}
	],
	nearMisses: [],
	allTimeRecords: []
};

vi.mock('$lib/api/recordsTracker', () => ({
	fetchRecordsTracker: vi.fn()
}));

import { fetchRecordsTracker } from '$lib/api/recordsTracker';
import { GET } from './+server';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('GET /api/records', () => {
	it('returns 200 with the records data', async () => {
		vi.mocked(fetchRecordsTracker).mockResolvedValue(mockResult);

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.brokenRecords[0].label).toBe('Hottest August day');
	});

	it('caches the result so a second request does not call the upstream again', async () => {
		vi.mocked(fetchRecordsTracker).mockResolvedValue(mockResult);
		await GET({} as Parameters<typeof GET>[0]);

		vi.mocked(fetchRecordsTracker).mockClear();
		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(fetchRecordsTracker).not.toHaveBeenCalled();
	});

	it('returns a 502 with an error body when the upstream fetch fails', async () => {
		vi.mocked(fetchRecordsTracker).mockRejectedValue(new Error('Open-Meteo error: 429'));

		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	it('does not call the upstream again while a recent failure is cached', async () => {
		vi.mocked(fetchRecordsTracker).mockRejectedValue(new Error('Open-Meteo error: 429'));
		await GET({} as Parameters<typeof GET>[0]);

		vi.mocked(fetchRecordsTracker).mockClear();
		const response = await GET({} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(502);
		expect(fetchRecordsTracker).not.toHaveBeenCalled();
	});
});
