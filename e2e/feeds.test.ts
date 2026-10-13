import { expect, test } from '@playwright/test';

test.describe('XML feeds', () => {
	test('/feed.xml returns a valid RSS feed', async ({ request }) => {
		const response = await request.get('/feed.xml');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('application/rss+xml');

		const body = await response.text();
		expect(body).toContain('<rss');
	});

	test('/sitemap.xml returns a valid sitemap', async ({ request }) => {
		const response = await request.get('/sitemap.xml');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('application/xml');

		const body = await response.text();
		expect(body).toContain('<urlset');
	});
});
