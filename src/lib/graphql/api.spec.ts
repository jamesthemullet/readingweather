import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addComment, fetchGraphQL } from './api';

describe('fetchGraphQL', () => {
	const jsonHeaders = { get: (key: string) => (key === 'content-type' ? 'application/json' : null) };

	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: jsonHeaders,
				json: async () => ({ data: { posts: { nodes: [] } } })
			})
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('resolves with the data property on a successful response', async () => {
		const expected = { posts: { nodes: [{ id: '1' }] } };
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: jsonHeaders,
				json: async () => ({ data: expected })
			})
		);

		const result = await fetchGraphQL('{ posts { nodes { id } } }');

		expect(result).toEqual(expected);
	});

	it('throws when the HTTP response is not ok', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				headers: jsonHeaders,
				json: async () => ({ errors: [{ message: 'Server error' }] })
			})
		);

		await expect(fetchGraphQL('{ posts { nodes { id } } }')).rejects.toThrow(
			'Failed to fetch data'
		);
	});

	it('throws when the response contains GraphQL errors even if HTTP status is ok', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: jsonHeaders,
				json: async () => ({ errors: [{ message: 'Field not found' }], data: null })
			})
		);

		await expect(fetchGraphQL('{ nonexistent }')).rejects.toThrow('Failed to fetch data');
	});
});

describe('addComment', () => {
	const jsonHeaders = { get: (key: string) => (key === 'content-type' ? 'application/json' : null) };

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns { success: true } when the mutation succeeds', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: jsonHeaders,
				json: async () => ({ data: { createComment: { success: true } } })
			})
		);

		const result = await addComment(123, 'Great post!', 'Alice', 'alice@example.com');

		expect(result).toEqual({ success: true });
	});

	it('returns { success: false } when createComment is null in the response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: jsonHeaders,
				json: async () => ({ data: { createComment: null } })
			})
		);

		const result = await addComment(123, 'Hello', 'Bob', 'bob@example.com');

		expect(result).toEqual({ success: false });
	});

	it('includes parentId in the mutation input variables when provided', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: jsonHeaders,
			json: async () => ({ data: { createComment: { success: true } } })
		});
		vi.stubGlobal('fetch', mockFetch);

		await addComment(123, 'Reply!', 'Alice', 'alice@example.com', 456);

		const [, options] = mockFetch.mock.calls[0] as [string, { body: string }];
		const body = JSON.parse(options.body) as { variables: { input: { parent: number } } };
		expect(body.variables.input.parent).toBe(456);
	});
});

describe('fetchGraphQL — non-JSON response', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('throws with a descriptive message when the endpoint returns a non-JSON content-type', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				headers: { get: (key: string) => (key === 'content-type' ? 'text/html' : null) },
				json: async () => ({})
			})
		);

		await expect(fetchGraphQL('{ posts { nodes { id } } }')).rejects.toThrow(
			'GraphQL endpoint returned non-JSON response (200)'
		);
	});
});
