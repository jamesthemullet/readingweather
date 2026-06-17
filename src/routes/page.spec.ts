import { describe, expect, it, vi } from 'vitest';
import type { AllPostsResponse, LatestSeasonalPostResponse } from '$lib/types';
import { load } from './+page';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

type HomeLoadResult = {
	posts: AllPostsResponse;
	latestSeasonalPost: LatestSeasonalPostResponse['posts']['nodes'][0] | null;
	meta: { title: string; description: string };
};

const mockPosts = { posts: { nodes: [{ date: '2026-01-01', slug: 'test', title: 'Test', content: '' }] } };
const mockSeasonalPost = { posts: { nodes: [{ slug: 'summer-2026', title: 'Summer 2026 Forecast', date: '2026-06-01' }] } };

describe('home page load', () => {
	it('returns posts, latestSeasonalPost, and meta', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(mockSeasonalPost);

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toMatchObject({
			posts: mockPosts,
			latestSeasonalPost: mockSeasonalPost.posts.nodes[0],
			meta: expect.objectContaining({ title: expect.any(String), description: expect.any(String) })
		});
	});

	it('sets the correct page title in meta', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(mockSeasonalPost);

		const { meta } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(meta.title).toBe('Weather Forecast For Reading & Berkshire');
	});

	it('returns null for latestSeasonalPost when the query throws', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockRejectedValueOnce(new Error('Not found'));

		const { latestSeasonalPost } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(latestSeasonalPost).toBeNull();
	});
});
