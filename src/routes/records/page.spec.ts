import { describe, expect, it, vi } from 'vitest';
import type { RecordsTrackerResult } from '$lib/api/recordsTracker';
import { load } from './+page.server';

const mockRecords: RecordsTrackerResult = {
	year: 2026,
	asOf: '20 August 2026',
	asOfDate: '2026-08-20',
	yearsOfData: 87,
	brokenRecords: [],
	nearMisses: [],
	allTimeRecords: []
};

function makeEvent(fetchImpl: typeof fetch) {
	return {
		fetch: fetchImpl,
		setHeaders: vi.fn()
	} as unknown as Parameters<typeof load>[0];
}

describe('records load', () => {
	it('loads the records from the API and sets a cache header', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockRecords });
		const event = makeEvent(mockFetch);

		const result = await load(event);

		expect(result).toEqual({ records: mockRecords });
		expect(mockFetch).toHaveBeenCalledWith('/api/records');
		expect(event.setHeaders).toHaveBeenCalledWith({
			'cache-control': 'public, max-age=0, s-maxage=43200'
		});
	});

	it('throws a 503 when the API responds with an error', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 502 });
		const event = makeEvent(mockFetch);

		await expect(load(event)).rejects.toMatchObject({ status: 503 });
	});
});
