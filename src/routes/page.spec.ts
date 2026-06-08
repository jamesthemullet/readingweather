import { describe, expect, it, vi } from 'vitest';
import { load } from './+page';
import type { AllPostsResponse, OnThisDayResponse } from '$lib/types';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

type HomeLoadResult = {
	posts: AllPostsResponse;
	onThisDay: OnThisDayResponse | null;
	meta: { title: string; description: string };
};

const mockPosts = { posts: { nodes: [{ date: '2026-01-01', slug: 'test', title: 'Test', content: '' }] } };
const mockOnThisDay = { posts: { nodes: [{ title: 'Old post', slug: 'old-post', date: '2020-06-02' }] } };

describe('home page load', () => {
	it('returns posts, onThisDay, and meta', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(mockOnThisDay);

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toMatchObject({
			posts: mockPosts,
			onThisDay: mockOnThisDay,
			meta: expect.objectContaining({ title: expect.any(String), description: expect.any(String) })
		});
	});

	it('sets the correct page title in meta', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(mockOnThisDay);

		const { meta } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(meta.title).toBe('Weather Forecast For Reading & Berkshire');
	});

	it('returns null for onThisDay when the query throws', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockRejectedValueOnce(new Error('Not found'));

		const { onThisDay } = (await load({} as Parameters<typeof load>[0])) as HomeLoadResult;

		expect(onThisDay).toBeNull();
	});
});
