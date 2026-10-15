import { expect, test } from '@playwright/test';

test.describe('newsletter subscription API — CSRF/origin behaviour', () => {
	test('rejects a cross-site request with a disallowed Origin header', async ({ request }) => {
		const response = await request.post('/api/subscribe', {
			headers: {
				host: 'example.com',
				origin: 'https://evil.example.com'
			},
			data: { name: 'Alice', email: 'alice@example.com' }
		});

		expect(response.status()).toBe(403);
		expect((await response.json()).message).toBe('Forbidden');
	});

	test('rejects malformed JSON with a 400', async ({ request }) => {
		const response = await request.post('/api/subscribe', {
			headers: { 'content-type': 'application/json' },
			data: Buffer.from('not valid json {')
		});

		expect(response.status()).toBe(400);
		expect((await response.json()).message).toBe('Invalid request body');
	});
});
