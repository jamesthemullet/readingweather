import { describe, expect, it, vi } from 'vitest';
import type { GqlPageNode } from '$lib/types';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';
import { loadPageById } from './loadPageById';

const mockPage: GqlPageNode = {
	title: 'About',
	slug: 'about',
	content: '<p>About the site</p>',
	seo: { description: 'About Reading Weather', opengraphDescription: 'About OG' }
};

describe('loadPageById', () => {
	it('returns the page when fetchGraphQL resolves a page', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: mockPage });

		const load = loadPageById(2);
		const result = await load({ fetch } as Parameters<typeof load>[0]);

		expect(result).toEqual({ page: mockPage });
	});

	it('passes the given pageId as the GraphQL id variable', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: mockPage });

		const load = loadPageById(161);
		await load({ fetch } as Parameters<typeof load>[0]);

		expect(fetchGraphQL).toHaveBeenCalledWith(expect.any(String), { id: 161 }, fetch);
	});

	it('throws a 404 error when fetchGraphQL returns no page', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: null });

		const load = loadPageById(169);
		await expect(load({ fetch } as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 404 });
	});
});
