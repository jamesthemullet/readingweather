import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheStore = new Map<string, unknown>();

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn((key: string) => cacheStore.get(key) ?? null),
	setCache: vi.fn((key: string, data: unknown) => {
		cacheStore.set(key, data);
	})
}));

import { withCachedFetch } from './withCachedFetch';

beforeEach(() => {
	cacheStore.clear();
	vi.clearAllMocks();
});

describe('withCachedFetch', () => {
	it('returns 200 with the fetched data on a cache miss', async () => {
		const fetchFn = vi.fn().mockResolvedValue({ value: 'fresh' });

		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ value: 'fresh' });
	});

	it('does not call fetchFn again once the result is cached', async () => {
		const fetchFn = vi.fn().mockResolvedValue({ value: 'fresh' });
		await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		fetchFn.mockClear();
		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ value: 'fresh' });
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('caches and replays a legitimately falsy (null) result as a hit', async () => {
		const fetchFn = vi.fn().mockResolvedValue(null);
		await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		fetchFn.mockClear();
		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		expect(response.status).toBe(200);
		expect(await response.json()).toBeNull();
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('returns a 502 with the given error message when fetchFn throws', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('boom'));

		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: 'unavailable' });
	});

	it('does not call fetchFn again while a recent failure is cached', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('boom'));
		await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		fetchFn.mockClear();
		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable');

		expect(response.status).toBe(502);
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('defers to onFetchError when it handles the error, and skips error-caching it', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('not yet ready'));
		const onFetchError = vi.fn((err: unknown) =>
			err instanceof Error && err.message === 'not yet ready'
				? new Response(JSON.stringify({ error: err.message }), { status: 400 })
				: undefined
		);

		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable', onFetchError);
		expect(response.status).toBe(400);

		fetchFn.mockClear();
		const second = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable', onFetchError);

		expect(second.status).toBe(400);
		expect(fetchFn).toHaveBeenCalledTimes(1);
	});

	it('falls back to the generic 502 handling when onFetchError declines to handle the error', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('boom'));
		const onFetchError = vi.fn().mockReturnValue(undefined);

		const response = await withCachedFetch('key', 1000, 1000, fetchFn, 'unavailable', onFetchError);

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: 'unavailable' });
	});
});
