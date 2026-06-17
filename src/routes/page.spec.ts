import { describe, expect, it, vi } from 'vitest';
import type { AllPostsResponse, LatestSeasonalPostResponse, OnThisDayResponse } from '$lib/types';
import { load } from './+page';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

type HomeLoadResult = {
	posts: AllPostsResponse;
	latestSeasonalPost: LatestSeasonalPostResponse['posts']['nodes'][0] | null;
	onThisDay: OnThisDayResponse | null;
	meta: { title: string; description: string };
};

const mockPosts = { posts: { nodes: [{ date: '2026-01-01', slug: 'test', title: 'Test', content: '' }] } };
const mockSeasonalPost = { posts: { nodes: [{ slug: 'summer-2026', title: 'Summer 2026 Forecast', date: '2026-06-01' }] } };
const mockOnThisDay = { posts: { nodes: [{ title: 'Old post', slug: 'old-post', date: '2020-06-02' }] } };

describe('home page load', () => {
	it('returns posts, latestSeasonalPost, onThisDay, and meta', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalPost)
			.mockResolvedValueOnce(mockOnThisDay);

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toMatchObject({
			posts: mockPosts,
			latestSeasonalPost: mockSeasonalPost.posts.nodes[0],
			onThisDay: mockOnThisDay,
			meta: expect.objectContaining({ title: expect.any(String), description: expect.any(String) })
		});
	});

	it('sets the correct page title in meta', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalPost)
			.mockResolvedValueOnce(mockOnThisDay);

		const { meta } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(meta.title).toBe('Weather Forecast For Reading & Berkshire');
	});

	it('returns null for latestSeasonalPost when the query throws', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockRejectedValueOnce(new Error('Not found'))
			.mockResolvedValueOnce(mockOnThisDay);

		const { latestSeasonalPost } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(latestSeasonalPost).toBeNull();
	});

	it('returns null for onThisDay when the query throws', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalPost)
			.mockRejectedValueOnce(new Error('Not found'));

		const { onThisDay } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(onThisDay).toBeNull();
	});
});
