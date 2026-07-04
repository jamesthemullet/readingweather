import { afterEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

type ArchiveEntry = { year: number; month: number };
type ArchivePost = { title: string; slug: string; date: string };
type ArchiveLoadResult = {
	archives: ArchiveEntry[];
	selectedYear: number;
	selectedMonth: number;
	posts: ArchivePost[];
};

function makeUrl(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/archives');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return url;
}

afterEach(() => {
	vi.clearAllMocks();
});

describe('archives load — generateArchives', () => {
	it('does not include any month beyond the current date', async () => {
		const { archives } = (await load({ url: makeUrl(), setHeaders: vi.fn() } as unknown as Parameters<typeof load>[0])) as ArchiveLoadResult;
		const now = new Date();
		const future = archives.filter(
			(a) =>
				a.year > now.getFullYear() ||
				(a.year === now.getFullYear() && a.month > now.getMonth() + 1)
		);
		expect(future).toHaveLength(0);
	});

	it('returns archive entries in reverse chronological order', async () => {
		const { archives } = (await load({ url: makeUrl(), setHeaders: vi.fn() } as unknown as Parameters<typeof load>[0])) as ArchiveLoadResult;
		for (let i = 0; i < archives.length - 1; i++) {
			const current = archives[i].year * 12 + archives[i].month;
			const next = archives[i + 1].year * 12 + archives[i + 1].month;
			expect(current).toBeGreaterThan(next);
		}
	});
});

describe('archives load — post fetching', () => {
	it('calls fetchGraphQL with year and month and returns the resulting posts', async () => {
		const mockPosts: ArchivePost[] = [
			{ title: 'January Frost', slug: 'january-frost', date: '2025-01-15T00:00:00' }
		];
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ posts: { nodes: mockPosts } });

		const result = (await load({
			url: makeUrl({ year: '2025', month: '1' }),
			setHeaders: vi.fn()
		} as unknown as Parameters<typeof load>[0])) as ArchiveLoadResult;

		expect(vi.mocked(fetchGraphQL)).toHaveBeenCalledWith(expect.anything(), {
			year: 2025,
			month: 1
		}, undefined);
		expect(result.posts).toEqual(mockPosts);
		expect(result.selectedYear).toBe(2025);
		expect(result.selectedMonth).toBe(1);
	});

	it('returns an empty posts array and does not call fetchGraphQL when no params are given', async () => {
		const result = (await load({
			url: makeUrl(),
			setHeaders: vi.fn()
		} as unknown as Parameters<typeof load>[0])) as ArchiveLoadResult;

		expect(vi.mocked(fetchGraphQL)).not.toHaveBeenCalled();
		expect(result.posts).toEqual([]);
		expect(result.selectedYear).toBe(0);
		expect(result.selectedMonth).toBe(0);
	});

	it('returns empty posts and skips fetchGraphQL when only year param is provided', async () => {
		const result = (await load({
			url: makeUrl({ year: '2025' }),
			setHeaders: vi.fn()
		} as unknown as Parameters<typeof load>[0])) as ArchiveLoadResult;

		expect(vi.mocked(fetchGraphQL)).not.toHaveBeenCalled();
		expect(result.posts).toEqual([]);
	});
});
