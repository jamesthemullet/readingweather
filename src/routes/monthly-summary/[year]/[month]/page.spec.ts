import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';
import { load } from './+page.server';

const mockSummary = {
	year: 2026,
	month: 6,
	monthName: 'June',
	label: 'June 2026',
	yearsOfData: 87,
	temperature: { high: 28.5, low: 9.2, mean: 17.1, historicalAverageMean: 15.8 },
	rainfall: {
		total: 42.3,
		wettestDay: { date: '2026-06-14', value: 18.2 },
		historicalAverageTotal: 50.1
	},
	sunshine: {
		totalHours: 210.4,
		sunniestDay: { date: '2026-06-21', hours: 14.8 },
		historicalAverageHours: 190.2
	},
	temperatureRank: 3,
	headline: 'June 2026 was the 3rd warmest June in Reading since 1940',
	records: {
		hottestDay: { date: '2026-06-20', year: 2026, value: 32.1 },
		coldestDay: { date: '1962-06-02', year: 1962, value: 1.2 },
		wettestDay: { date: '1971-06-14', year: 1971, value: 40.5 }
	}
};

function makeEvent(params: Record<string, string>, fetchImpl: typeof fetch) {
	return {
		params,
		fetch: fetchImpl,
		setHeaders: vi.fn()
	} as unknown as Parameters<typeof load>[0];
}

describe('monthly-summary/[year]/[month] load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the summary from the API, related posts from GraphQL, and sets an immutable cache header', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockSummary });
		const relatedPosts = [{ title: 'A sunny June day', slug: 'a-sunny-june-day', date: '2026-06-05' }];
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ posts: { nodes: relatedPosts } });
		const event = makeEvent({ year: '2026', month: '06' }, mockFetch);

		const result = await load(event);

		expect(result).toEqual({ summary: mockSummary, relatedPosts });
		expect(mockFetch).toHaveBeenCalledWith('/api/monthly-summary?year=2026&month=6');
		expect(fetchGraphQL).toHaveBeenCalledWith(
			expect.any(String),
			{ year: 2026, month: 6 },
			mockFetch
		);
		expect(event.setHeaders).toHaveBeenCalledWith({
			'cache-control': 'public, max-age=31536000, immutable'
		});
	});

	it('falls back to an empty related posts list when the GraphQL fetch fails', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockSummary });
		vi.mocked(fetchGraphQL).mockRejectedValueOnce(new Error('WordPress unavailable'));
		const event = makeEvent({ year: '2026', month: '06' }, mockFetch);

		const result = await load(event);

		expect(result).toEqual({ summary: mockSummary, relatedPosts: [] });
	});

	it('throws a 404 when the month param is out of range', async () => {
		const mockFetch = vi.fn();
		const event = makeEvent({ year: '2026', month: '13' }, mockFetch);

		await expect(load(event)).rejects.toMatchObject({ status: 404 });
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('throws a 404 when the API responds with an error', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false });
		const event = makeEvent({ year: '2026', month: '07' }, mockFetch);

		await expect(load(event)).rejects.toMatchObject({ status: 404 });
	});

	it('throws a 503 when the API reports the upstream is temporarily unavailable', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 502 });
		const event = makeEvent({ year: '2026', month: '07' }, mockFetch);

		await expect(load(event)).rejects.toMatchObject({ status: 503 });
	});
});
