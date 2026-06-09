import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

function makeRequest() {
	return {} as Parameters<typeof GET>[0];
}

describe('GET /sitemap.xml', () => {
	it('returns valid XML with the correct content-type header and includes static routes and post slugs', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({
			posts: { nodes: [{ slug: 'sunny-reading-june', date: '2025-06-01T09:00:00' }] }
		});

		const response = await GET(makeRequest());

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/xml');
		const body = await response.text();
		expect(body).toContain('<?xml version="1.0"');
		expect(body).toContain('/about');
		expect(body).toContain('/sunny-reading-june');
		expect(body).toContain('2025-06-01');
	});

	it('returns a 500 response when fetchGraphQL throws', async () => {
		vi.mocked(fetchGraphQL).mockRejectedValueOnce(new Error('GraphQL unavailable'));

		const response = await GET(makeRequest());

		expect(response.status).toBe(500);
	});
});
