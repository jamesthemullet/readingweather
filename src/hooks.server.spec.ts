import { describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server';

function makeEvent(pathname: string) {
	return { url: new URL(`http://localhost${pathname}`) };
}

function makeResolve() {
	return vi.fn().mockResolvedValue(new Response('ok'));
}

describe('hooks handle', () => {
	it('sets X-Frame-Options: SAMEORIGIN on all responses', async () => {
		const response = await handle({
			event: makeEvent('/any-page') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
	});

	it('sets a short-lived cache-control for the homepage', async () => {
		const response = await handle({
			event: makeEvent('/') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('cache-control')).toBe(
			'public, max-age=300, stale-while-revalidate=60'
		);
	});

	it('sets a longer cache-control for the seasonal-forecasts page', async () => {
		const response = await handle({
			event: makeEvent('/seasonal-forecasts') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('cache-control')).toBe(
			'public, max-age=3600, stale-while-revalidate=300'
		);
	});

	it('sets a medium-lived cache-control for the archives page', async () => {
		const response = await handle({
			event: makeEvent('/archives') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('cache-control')).toBe(
			'public, max-age=600, stale-while-revalidate=120'
		);
	});

	it('does not set a cache-control header for non-cached paths such as post slugs', async () => {
		const response = await handle({
			event: makeEvent('/sunny-reading-june') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('cache-control')).toBeNull();
	});

	it('sets X-Content-Type-Options: nosniff on all responses', async () => {
		const response = await handle({
			event: makeEvent('/any-page') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
	});
});
