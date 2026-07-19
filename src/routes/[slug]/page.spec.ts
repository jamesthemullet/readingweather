import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GqlPostNode } from '$lib/types';
import { load } from './+page.server';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn().mockReturnValue(null),
	setCache: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';
import { getCache } from '$lib/server/cache';

type SeasonalPostStub = { slug: string; title: string; date: string };
type SlugLoadResult = {
	post: GqlPostNode;
	isLatest: boolean;
	latestSlug: string | undefined;
	latestSeasonalPost: SeasonalPostStub | null;
};

const mockPost = {
	id: '1',
	title: 'Test Post',
	slug: 'test-post',
	content: '<p>Content</p>',
	date: '2026-01-01',
	seo: { description: 'A test post', opengraphDescription: 'OG description' }
};

describe('[slug] page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getCache).mockReturnValue(null);
	});

	it('returns post data and isLatest=true when slug matches the newest post', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce({ postBy: mockPost })
			.mockResolvedValueOnce({ posts: { nodes: [{ slug: 'test-post' }] } })
			.mockResolvedValueOnce({ posts: { nodes: [] } });

		const result = (await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0])) as SlugLoadResult;

		expect(result.post).toEqual(mockPost);
		expect(result.isLatest).toBe(true);
		expect(result.latestSlug).toBe('test-post');
	});

	it('returns isLatest=false when the slug is not the newest post', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce({ postBy: mockPost })
			.mockResolvedValueOnce({ posts: { nodes: [{ slug: 'newer-post' }] } })
			.mockResolvedValueOnce({ posts: { nodes: [] } });

		const result = (await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0])) as SlugLoadResult;

		expect(result.isLatest).toBe(false);
		expect(result.latestSlug).toBe('newer-post');
	});

	it('throws a 404 error when postBy is null', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce({ postBy: null })
			.mockResolvedValueOnce({ posts: { nodes: [] } })
			.mockResolvedValueOnce({ posts: { nodes: [] } });

		await expect(
			load({ params: { slug: 'missing-post' } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('uses cached latest slug when available', async () => {
		vi.mocked(getCache).mockReturnValue('cached-latest-slug');
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce({ postBy: mockPost })
			.mockResolvedValueOnce({ posts: { nodes: [] } });

		const result = (await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0])) as SlugLoadResult;

		expect(result.isLatest).toBe(false);
		expect(result.latestSlug).toBe('cached-latest-slug');
		expect(vi.mocked(fetchGraphQL)).toHaveBeenCalledTimes(2);
	});

	it('returns latestSeasonalPost when the seasonal query has a post', async () => {
		const mockSeasonalPost: SeasonalPostStub = {
			slug: 'summer-forecast-2026',
			title: 'Summer Forecast 2026',
			date: '2026-06-01'
		};
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce({ postBy: mockPost })
			.mockResolvedValueOnce({ posts: { nodes: [{ slug: 'test-post' }] } })
			.mockResolvedValueOnce({ posts: { nodes: [mockSeasonalPost] } });

		const result = (await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0])) as SlugLoadResult;

		expect(result.latestSeasonalPost).toEqual(mockSeasonalPost);
	});

	it('returns null for latestSeasonalPost when the seasonal query returns no nodes', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce({ postBy: mockPost })
			.mockResolvedValueOnce({ posts: { nodes: [{ slug: 'test-post' }] } })
			.mockResolvedValueOnce({ posts: { nodes: [] } });

		const result = (await load({ params: { slug: 'test-post' } } as Parameters<typeof load>[0])) as SlugLoadResult;

		expect(result.latestSeasonalPost).toBeNull();
	});
});
