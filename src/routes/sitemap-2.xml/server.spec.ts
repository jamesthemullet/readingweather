import { describe, expect, it, vi, beforeEach } from 'vitest';
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

describe('GET /sitemap-2.xml', () => {
	it('returns valid XML with correct headers, static routes, and post slugs', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			posts: { nodes: [{ slug: 'reading-frost-2025', date: '2025-01-10T08:00:00' }] }
		});

		const response = await GET(makeRequest());

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/xml');
		expect(response.headers.get('Cache-Control')).toBe('max-age=0, s-maxage=3600');
		const body = await response.text();
		expect(body).toContain('<?xml version="1.0"');
		expect(body).toContain('/about');
		expect(body).toContain('/reading-frost-2025');
		expect(body).toContain('2025-01-10');
	});

	it('escapes XML special characters in post slugs', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			posts: { nodes: [{ slug: 'rain-&-shine', date: null }] }
		});

		const response = await GET(makeRequest());
		const body = await response.text();

		expect(body).toContain('rain-&amp;-shine');
		expect(body).not.toContain('rain-&-shine');
	});

	it('returns a 500 response when fetchGraphQL throws', async () => {
		vi.mocked(fetchGraphQL).mockRejectedValueOnce(new Error('GraphQL unavailable'));

		const response = await GET(makeRequest());

		expect(response.status).toBe(500);
	});
});
