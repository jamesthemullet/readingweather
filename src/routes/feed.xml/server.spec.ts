import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

vi.mock('$lib/server/cache', () => ({
	getCache: vi.fn().mockReturnValue(null),
	setCache: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

function makeRequest() {
	return {} as Parameters<typeof GET>[0];
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /feed.xml', () => {
	it('returns valid RSS XML with the correct content-type header and includes post details', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			posts: {
				nodes: [
					{
						slug: 'sunny-reading-june',
						title: 'Sunny spells for June',
						date: '2025-06-01T09:00:00',
						excerpt: '<p>A warm and bright start to the month.</p>',
						featuredImage: { node: { sourceUrl: 'https://blog.readingweather.co.uk/image.jpg' } }
					}
				]
			}
		});

		const response = await GET(makeRequest());

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8');
		const body = await response.text();
		expect(body).toContain('<?xml version="1.0"');
		expect(body).toContain('<rss version="2.0"');
		expect(body).toContain('Sunny spells for June');
		expect(body).toContain('https://www.readingweather.co.uk/sunny-reading-june');
		expect(body).toContain('A warm and bright start to the month.');
		expect(body).toContain('<enclosure url="https://blog.readingweather.co.uk/image.jpg"');
	});

	it('returns a 500 response when fetchGraphQL throws', async () => {
		vi.mocked(fetchGraphQL).mockRejectedValueOnce(new Error('GraphQL unavailable'));

		const response = await GET(makeRequest());

		expect(response.status).toBe(500);
	});
});
