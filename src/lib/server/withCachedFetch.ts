import { json } from '@sveltejs/kit';
import { getCache, setCache } from '$lib/server/cache';

// Wrapping the cached value lets a legitimately falsy result (e.g. `null`, meaning
// "no active streak") be cached and recognised as a hit, rather than being
// indistinguishable from a cache miss.
type CachedResult<T> = { data: T };

export async function withCachedFetch<T>(
	cacheKey: string,
	ttlMs: number,
	errorTtlMs: number,
	fetchFn: () => Promise<T>,
	errorMessage: string,
	onFetchError?: (err: unknown) => Response | undefined
): Promise<Response> {
	const cached = getCache<CachedResult<T>>(cacheKey);
	if (cached) return json(cached.data);

	const errorCacheKey = `${cacheKey}-error`;
	if (getCache<true>(errorCacheKey)) {
		return json({ error: errorMessage }, { status: 502 });
	}

	try {
		const data = await fetchFn();
		setCache<CachedResult<T>>(cacheKey, { data }, ttlMs);
		return json(data);
	} catch (err) {
		const handled = onFetchError?.(err);
		if (handled) return handled;

		// Avoid hammering an already-failing/rate-limited upstream on every request.
		setCache(errorCacheKey, true, errorTtlMs);
		console.error(`${errorMessage}:`, err);
		return json({ error: errorMessage }, { status: 502 });
	}
}
