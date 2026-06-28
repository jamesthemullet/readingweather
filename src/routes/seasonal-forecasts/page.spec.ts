import { describe, expect, it, vi } from 'vitest';
import type { SeasonalPostsResponse } from '$lib/types';
import { load } from './+page.server';

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>;

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

const mockPost = {
	date: '2025-06-01T00:00:00',
	slug: 'summer-2025-forecast',
	title: 'Summer 2025 Forecast',
	content: '<p>Warm and sunny</p>',
	featuredImage: { node: { sourceUrl: '/img/summer.jpg', srcSet: '' } },
	comments: { nodes: [] }
};

describe('seasonal-forecasts page load', () => {
	it('returns the full GraphQL response in the posts key', async () => {
		const mockResponse: SeasonalPostsResponse = { posts: { nodes: [mockPost] } };
		vi.mocked(fetchGraphQL).mockResolvedValueOnce(mockResponse);

		const result = await load({ setHeaders: vi.fn() } as Parameters<typeof load>[0]) as LoadResult;

		expect(result.posts).toEqual(mockResponse);
	});

	it('propagates errors thrown by fetchGraphQL', async () => {
		vi.mocked(fetchGraphQL).mockRejectedValueOnce(new Error('Network error'));

		await expect(load({ setHeaders: vi.fn() } as Parameters<typeof load>[0])).rejects.toThrow('Network error');
	});
});
