import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>;

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

vi.mock('$lib/api/historicalWeather', () => ({
	fetchHistoricalWeather: vi.fn()
}));

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn(() => null),
	setCache: vi.fn()
}));

import { fetchHistoricalWeather } from '$lib/api/historicalWeather';
import { fetchGraphQL } from '$lib/graphql/api';

const mockPosts = {
	posts: {
		nodes: [
			{
				date: '2026-06-01T00:00:00',
				slug: 'sunny-june',
				title: 'Sunny June',
				content: '<p>Warm</p>'
			}
		]
	}
};

const mockSeasonalResponse = {
	posts: {
		nodes: [
			{
				slug: 'summer-2026',
				title: 'Summer 2026',
				date: '2026-06-01T00:00:00'
			}
		]
	}
};

const mockOnThisDay = {
	posts: {
		nodes: [{ title: 'Rain in 2024', slug: 'rain-june-2024', date: '2024-06-21T00:00:00' }]
	}
};

const mockFetch = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(fetchHistoricalWeather).mockResolvedValue([]);
});

describe('home page load', () => {
	it('returns posts and correct meta on a successful fetch', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalResponse)
			.mockResolvedValueOnce(mockOnThisDay);

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.posts).toEqual(mockPosts);
		expect(result.meta.title).toBe('Weather Forecast For Reading & Berkshire');
		expect(result.meta.description).toContain('Reading');
	});

	it('returns the first seasonal post node as latestSeasonalPost', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalResponse)
			.mockResolvedValueOnce(mockOnThisDay);

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.latestSeasonalPost).toEqual(mockSeasonalResponse.posts.nodes[0]);
	});

	it('returns null for latestSeasonalPost when the seasonal fetch fails', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockRejectedValueOnce(new Error('GraphQL down'))
			.mockResolvedValueOnce(mockOnThisDay);

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.latestSeasonalPost).toBeNull();
	});

	it('returns null for latestSeasonalPost when the seasonal response has no nodes', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce({ posts: { nodes: [] } })
			.mockResolvedValueOnce(mockOnThisDay);

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.latestSeasonalPost).toBeNull();
	});

	it('returns lastMonth as the previous calendar month', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalResponse)
			.mockResolvedValueOnce(mockOnThisDay);

		const result = (await load({
			setHeaders: vi.fn(),
			fetch: mockFetch
		} as unknown as Parameters<typeof load>[0])) as LoadResult;

		expect(result.lastMonth).toEqual({ year: 2026, month: 6, label: 'June 2026' });
		vi.useRealTimers();
	});

	it('returns null for onThisDay when that fetch fails', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalResponse)
			.mockRejectedValueOnce(new Error('GraphQL down'));

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.onThisDay).toBeNull();
	});

	it('passes through historicalWeather data when the internal API call succeeds', async () => {
		vi.mocked(fetchGraphQL)
			.mockResolvedValueOnce(mockPosts)
			.mockResolvedValueOnce(mockSeasonalResponse)
			.mockResolvedValueOnce(mockOnThisDay);
		const weatherData = [{ year: 2024, tempMax: 22, tempMin: 11, precipitation: 0, windSpeedMax: 10, conditions: { morning: 'clear sky', afternoon: 'mainly clear', evening: 'clear sky' } }];
		vi.mocked(fetchHistoricalWeather).mockResolvedValueOnce(weatherData);

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.historicalWeather).toEqual(weatherData);
	});

	it('falls back to empty posts when the allPosts fetchGraphQL call fails', async () => {
		vi.mocked(fetchGraphQL)
			.mockRejectedValueOnce(new Error('GraphQL down'))
			.mockResolvedValueOnce(mockSeasonalResponse)
			.mockResolvedValueOnce(mockOnThisDay);

		const result = await load({ setHeaders: vi.fn(), fetch: mockFetch } as unknown as Parameters<typeof load>[0]) as LoadResult;

		expect(result.posts).toEqual({ posts: { nodes: [] } });
	});
});
