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

	it('sets a short-lived cache-control for post slug pages', async () => {
		const response = await handle({
			event: makeEvent('/sunny-reading-june') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('cache-control')).toBe(
			'public, max-age=300, stale-while-revalidate=60'
		);
	});

	it('sets X-Content-Type-Options: nosniff on all responses', async () => {
		const response = await handle({
			event: makeEvent('/any-page') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
	});

	it('sets Referrer-Policy: strict-origin-when-cross-origin on all responses', async () => {
		const response = await handle({
			event: makeEvent('/any-page') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});

	it('sets a Permissions-Policy header that blocks camera, microphone, and geolocation', async () => {
		const response = await handle({
			event: makeEvent('/any-page') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		const policy = response.headers.get('Permissions-Policy') ?? '';
		expect(policy).toContain('camera=()');
		expect(policy).toContain('microphone=()');
		expect(policy).toContain('geolocation=()');
	});

	it('sets a Content-Security-Policy header with key directives', async () => {
		const response = await handle({
			event: makeEvent('/any-page') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		const csp = response.headers.get('Content-Security-Policy') ?? '';
		expect(csp).toContain("default-src 'self'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain('https://www.googletagmanager.com');
	});

	it('does not set slug cache-control for paths that start with /api', async () => {
		const response = await handle({
			event: makeEvent('/api') as Parameters<typeof handle>[0]['event'],
			resolve: makeResolve()
		});

		expect(response.headers.get('cache-control')).toBeNull();
	});

	it('preserves an existing cache-control header set by the load function', async () => {
		const resolve = vi.fn().mockResolvedValue(
			new Response('ok', { headers: { 'cache-control': 'public, max-age=3600' } })
		);

		const response = await handle({
			event: makeEvent('/gallery') as Parameters<typeof handle>[0]['event'],
			resolve
		});

		expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
	});
});
