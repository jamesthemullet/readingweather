import { describe, expect, it, vi } from 'vitest';
import type { GqlPageNode } from '$lib/types';
import { load } from './+page';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

const mockPage: GqlPageNode = {
	title: 'Useful Links',
	slug: 'useful-links',
	content: '<p>Links to useful weather resources.</p>',
	seo: { description: 'Useful weather links', opengraphDescription: 'Useful links OG' }
};

describe('useful-links page load', () => {
	it('returns the page when fetchGraphQL resolves a page', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: mockPage });

		const result = await load({} as Parameters<typeof load>[0]);

		expect(result).toEqual({ page: mockPage });
	});

	it('throws a 404 error when fetchGraphQL returns no page', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: null });

		await expect(load({} as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 404 });
	});
});
