import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordsTrackerResult } from '$lib/api/recordsTracker';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

const mockRecords: RecordsTrackerResult = {
	year: 2026,
	asOf: '20 August 2026',
	asOfDate: '2026-08-20',
	yearsOfData: 87,
	brokenRecords: [],
	nearMisses: [],
	allTimeRecords: []
};

vi.mock('$lib/api/recordsTracker', () => ({
	fetchRecordsTracker: vi.fn()
}));

import { fetchRecordsTracker } from '$lib/api/recordsTracker';
import { load } from './+page.server';

function makeEvent() {
	return {
		setHeaders: vi.fn()
	} as unknown as Parameters<typeof load>[0];
}

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('records load', () => {
	it('loads the records from the API and sets a cache header', async () => {
		vi.mocked(fetchRecordsTracker).mockResolvedValue(mockRecords);
		const event = makeEvent();

		const result = await load(event);

		expect(result).toEqual({ records: mockRecords });
		expect(event.setHeaders).toHaveBeenCalledWith({
			'cache-control': 'public, max-age=0, s-maxage=43200'
		});
	});

	it('throws a 503 when the API responds with an error', async () => {
		vi.mocked(fetchRecordsTracker).mockRejectedValue(new Error('Open-Meteo error: 502'));
		const event = makeEvent();

		await expect(load(event)).rejects.toMatchObject({ status: 503 });
	});
});
