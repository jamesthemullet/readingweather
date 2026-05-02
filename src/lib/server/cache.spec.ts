import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCache, setCache } from './cache';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('getCache', () => {
	it('returns null on a cache miss', () => {
		expect(getCache('no-such-key')).toBeNull();
	});

	it('returns stored data on a cache hit', () => {
		setCache('hit-key', { foo: 'bar' }, 60_000);
		expect(getCache('hit-key')).toEqual({ foo: 'bar' });
	});

	it('returns null and evicts an expired entry', () => {
		setCache('expire-key', 'value', 1_000);
		vi.advanceTimersByTime(1_001);
		expect(getCache('expire-key')).toBeNull();
		// A second call also returns null (entry was evicted)
		expect(getCache('expire-key')).toBeNull();
	});

	it('does not expire an entry before the TTL elapses', () => {
		setCache('live-key', 42, 5_000);
		vi.advanceTimersByTime(4_999);
		expect(getCache('live-key')).toBe(42);
	});

	it('keeps different keys independent', () => {
		setCache('key-a', 'alpha', 60_000);
		setCache('key-b', 'beta', 60_000);
		expect(getCache('key-a')).toBe('alpha');
		expect(getCache('key-b')).toBe('beta');
	});
});
