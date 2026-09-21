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

	it('truncates content, name, and email to their maximum lengths before submitting', async () => {
		const longContent = 'x'.repeat(5010);
		const longName = 'n'.repeat(110);
		const longEmail = `${'a'.repeat(250)}@b.co`;
		const request = makeRequest({
			postId: validPostId,
			content: longContent,
			name: longName,
			email: longEmail
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		const calls = vi.mocked(addComment).mock.calls;
		const [, submittedContent, submittedName, submittedEmail] = calls[calls.length - 1];
		expect(submittedContent).toHaveLength(5000);
		expect(submittedContent).toBe('x'.repeat(5000));
		expect(submittedName).toHaveLength(100);
		expect(submittedName).toBe('n'.repeat(100));
		expect(submittedEmail).toHaveLength(254);
		expect(submittedEmail).toBe(longEmail.slice(0, 254));
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
});
