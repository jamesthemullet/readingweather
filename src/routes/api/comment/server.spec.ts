import { describe, expect, it, vi } from 'vitest';
import { ALLOWED_ORIGINS } from '$lib/server/config';
import { POST } from './+server';

vi.mock('$lib/graphql/api', () => ({
	addComment: vi.fn().mockResolvedValue({ success: true })
}));

import { addComment } from '$lib/graphql/api';

const validPostId = btoa('post:123');

function makeRequest(body: unknown, headerOverrides: Record<string, string> = {}) {
	return new Request('http://localhost/api/comment', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			origin: ALLOWED_ORIGINS[0],
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
			headers: { 'Content-Type': 'application/json', origin: ALLOWED_ORIGINS[0] },
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

	it('passes a numeric parentCommentId through to addComment as a threaded reply', async () => {
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'alice@example.com',
			parentCommentId: 42
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(addComment).toHaveBeenCalledWith(123, 'Great post!', 'Alice', 'alice@example.com', 42);
	});

	it('passes null to addComment when parentCommentId is omitted', async () => {
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(addComment).toHaveBeenCalledWith(123, 'Great post!', 'Alice', 'alice@example.com', null);
	});

	it('passes null to addComment when parentCommentId is not a number', async () => {
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'alice@example.com',
			parentCommentId: '42'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(addComment).toHaveBeenCalledWith(123, 'Great post!', 'Alice', 'alice@example.com', null);
	});

	it('returns 422 when addComment resolves with success: false', async () => {
		vi.mocked(addComment).mockResolvedValueOnce({ success: false });
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(422);
		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it('returns 502 when addComment throws', async () => {
		vi.mocked(addComment).mockRejectedValueOnce(new Error('GraphQL error'));
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(502);
	});

	it('truncates content to 5000 characters before passing it to addComment', async () => {
		const longContent = 'a'.repeat(5010);
		const request = makeRequest({
			postId: validPostId,
			content: longContent,
			name: 'Alice',
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(addComment).toHaveBeenCalledWith(123, 'a'.repeat(5000), 'Alice', 'alice@example.com', null);
		expect(vi.mocked(addComment).mock.calls[0][1]).toHaveLength(5000);
	});

	it('truncates name to 100 characters before passing it to addComment', async () => {
		const longName = 'b'.repeat(110);
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: longName,
			email: 'alice@example.com'
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(addComment).toHaveBeenCalledWith(123, 'Great post!', 'b'.repeat(100), 'alice@example.com', null);
	});

	it('truncates email to 254 characters before validating and passing it to addComment', async () => {
		const localPart = 'c'.repeat(254 - '@example.com'.length);
		const longEmail = `${localPart}@example.com${'d'.repeat(20)}`;
		const truncatedEmail = `${localPart}@example.com`;
		const request = makeRequest({
			postId: validPostId,
			content: 'Great post!',
			name: 'Alice',
			email: longEmail
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(truncatedEmail).toHaveLength(254);
		expect(addComment).toHaveBeenCalledWith(123, 'Great post!', 'Alice', truncatedEmail, null);
	});
});
