import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn(),
	setCache: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';
import { getCache } from '$lib/server/cache';

type GalleryPost = { slug: string; name: string };
type GalleryGroup = { month: number; posts: GalleryPost[] };
type GalleryLoadResult = { years: number[]; selectedYear: number; groupedPosts: GalleryGroup[] };

function makeEvent(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/gallery');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return { url, setHeaders: vi.fn() } as unknown as Parameters<typeof load>[0];
}

function makePost(slug: string, sourceUrl: string, date = '2023-01-01') {
	return { title: slug, slug, date, featuredImage: { node: { sourceUrl } } };
}

describe('gallery load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns cached data without calling fetchGraphQL when a cache hit exists', async () => {
		const cached: GalleryGroup[] = [{ month: 6, posts: [] }];
		vi.mocked(getCache).mockReturnValueOnce(cached);

		const result = (await load(makeEvent({ year: '2023' }))) as GalleryLoadResult;

		expect(result.groupedPosts).toBe(cached);
		expect(fetchGraphQL).not.toHaveBeenCalled();
	});

	it('filters out posts whose image filename contains PXL and derives names from remaining URLs', async () => {
		vi.mocked(getCache).mockReturnValue(null);
		vi.mocked(fetchGraphQL).mockResolvedValue({
			posts: {
				nodes: [
					makePost('pxl-post', 'https://example.com/PXL_20230101.jpg'),
					makePost('sunny-day', 'https://example.com/sunny-day-2023.jpg')
				]
			}
		});

		const result = (await load(makeEvent({ year: '2023' }))) as GalleryLoadResult;

		result.groupedPosts.forEach(({ posts }) => {
			expect(posts.every((p) => p.slug !== 'pxl-post')).toBe(true);
		});
		expect(result.groupedPosts[0].posts[0].name).toBe('Sunny Day');
	});

	it('returns all non-empty months sorted in descending order for a past year', async () => {
		vi.mocked(getCache).mockReturnValue(null);
		vi.mocked(fetchGraphQL).mockResolvedValue({
			posts: {
				nodes: [makePost('some-post', 'https://example.com/photo.jpg')]
			}
		});

		const result = (await load(makeEvent({ year: '2023' }))) as GalleryLoadResult;

		expect(result.groupedPosts).toHaveLength(12);
		for (let i = 0; i < result.groupedPosts.length - 1; i++) {
			expect(result.groupedPosts[i].month).toBeGreaterThan(result.groupedPosts[i + 1].month);
		}
	});

	it('filters out posts that have no featuredImage', async () => {
		vi.mocked(getCache).mockReturnValue(null);
		vi.mocked(fetchGraphQL).mockResolvedValue({
			posts: {
				nodes: [
					{ title: 'no-image', slug: 'no-image', date: '2023-01-01' },
					makePost('has-image', 'https://example.com/sunny.jpg')
				]
			}
		});

		const result = (await load(makeEvent({ year: '2023' }))) as GalleryLoadResult;

		const allSlugs = result.groupedPosts.flatMap(({ posts }) => posts.map((p) => p.slug));
		expect(allSlugs).not.toContain('no-image');
		expect(allSlugs).toContain('has-image');
	});

	it('defaults to the current year when no year param is provided', async () => {
		vi.mocked(getCache).mockReturnValue(null);
		vi.mocked(fetchGraphQL).mockResolvedValue({ posts: { nodes: [] } });

		const result = (await load(makeEvent())) as GalleryLoadResult;

		expect(result.selectedYear).toBe(new Date().getFullYear());
	});

	it('strips trailing digits from filename words when building image names', async () => {
		vi.mocked(getCache).mockReturnValue(null);
		vi.mocked(fetchGraphQL).mockResolvedValue({
			posts: {
				nodes: [makePost('photo-post', 'https://example.com/reading-photo1-jan.jpg')]
			}
		});

		const result = (await load(makeEvent({ year: '2023' }))) as GalleryLoadResult;

		const names = result.groupedPosts.flatMap(({ posts }) => posts.map((p) => p.name));
		expect(names).toContain('Reading Photo Jan');
	});
});
