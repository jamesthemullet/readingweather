import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

const ALLOWED_ORIGIN = 'https://www.readingweather.co.uk';

function makeRequest(body: unknown, headerOverrides: Record<string, string> = {}) {
	return new Request('http://localhost/api/subscribe', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			origin: ALLOWED_ORIGIN,
			...headerOverrides
		},
		body: JSON.stringify(body)
	});
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('POST /api/subscribe', () => {
	it('returns 403 when origin is not allowed and host is not localhost', async () => {
		const request = new Request('http://example.com/api/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', origin: 'https://evil.com' },
			body: JSON.stringify({})
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(403);
		const data = await response.json();
		expect(data.message).toBe('Forbidden');
	});

	it('returns 400 for an unparseable JSON body', async () => {
		const request = new Request('http://localhost/api/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', origin: ALLOWED_ORIGIN },
			body: 'not-json'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.message).toBe('Invalid request body');
	});

	it('returns 400 when name is missing', async () => {
		const request = makeRequest({ email: 'alice@example.com' });
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.message).toBe('Name and a valid email address are required');
	});

	it('returns 400 when email is missing', async () => {
		const request = makeRequest({ name: 'Alice' });
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
	});

	it('returns 400 for an invalid email format', async () => {
		const request = makeRequest({ name: 'Alice', email: 'not-an-email' });
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
	});

	it('proxies upstream response on success', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ message: 'Subscribed successfully' })
			})
		);
		const request = makeRequest({ name: 'Alice', email: 'alice@example.com' });
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.message).toBe('Subscribed successfully');
	});

	it('returns 502 when the upstream fetch throws', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));
		const request = makeRequest({ name: 'Alice', email: 'alice@example.com' });
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(502);
		const data = await response.json();
		expect(data.message).toBe('Something went wrong. Please try again.');
	});
});
