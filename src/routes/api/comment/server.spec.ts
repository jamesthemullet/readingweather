import { describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

vi.mock('$lib/graphql/api', () => ({
	addComment: vi.fn().mockResolvedValue({ success: true })
}));

const ALLOWED_ORIGIN = 'https://www.readingweather.co.uk';
const validPostId = btoa('post:123');

function makeRequest(body: unknown, headerOverrides: Record<string, string> = {}) {
	return new Request('http://localhost/api/comment', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			origin: ALLOWED_ORIGIN,
			...headerOverrides
		},
		body: JSON.stringify(body)
	});
}

describe('POST /api/comment', () => {
	it('returns 403 when origin is not allowed and host is not localhost', async () => {
		const request = new Request('http://example.com/api/comment', {
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
		const request = new Request('http://localhost/api/comment', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', origin: ALLOWED_ORIGIN },
			body: 'not-json'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.message).toBe('Invalid request body');
	});

	it('returns 400 when the post ID does not decode to a numeric ID', async () => {
		const request = makeRequest({
			postId: btoa('no-colon-number'),
			content: 'hello',
			name: 'Alice',
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.message).toBe('Invalid post ID');
	});

	it('returns 400 when required fields are missing', async () => {
		const request = makeRequest({ postId: validPostId });
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
	});

	it('returns 400 for an invalid email format', async () => {
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'not-an-email'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
	});

	it('returns 200 and success for a valid request', async () => {
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
	});
});
