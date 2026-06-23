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
});
