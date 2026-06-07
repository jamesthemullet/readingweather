import { describe, expect, it, vi } from 'vitest';
import { load } from './+page';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

const mockPost = {
	id: '1',
	title: 'Test Post',
	slug: 'test-post',
	content: '<p>Content</p>',
	date: '2026-01-01',
	seo: { description: 'A test post', opengraphDescription: 'OG description' }
};

describe('[slug] page load', () => {
	it('returns post data and isLatest=true when slug matches the newest post', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			postBy: mockPost,
			posts: { nodes: [{ slug: 'test-post' }] }
		});

		const result = await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0]);

		expect(result.post).toEqual(mockPost);
		expect(result.isLatest).toBe(true);
		expect(result.latestSlug).toBe('test-post');
	});

	it('returns isLatest=false when the slug is not the newest post', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			postBy: mockPost,
			posts: { nodes: [{ slug: 'newer-post' }] }
		});

		const result = await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0]);

		expect(result.isLatest).toBe(false);
		expect(result.latestSlug).toBe('newer-post');
	});

	it('throws a 404 error when postBy is null', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			postBy: null,
			posts: { nodes: [] }
		});

		await expect(
			load({ params: { slug: 'missing-post' } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});
