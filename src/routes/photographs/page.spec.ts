import { describe, expect, it, vi } from 'vitest';
import type { GqlPageNode } from '$lib/types';
import { load } from './+page.server';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

import { fetchGraphQL } from '$lib/graphql/api';

type PhotographsLoadResult = { page: GqlPageNode };

const mockPage = {
	title: 'Photographs',
	slug: 'photographs',
	content: '<p>A gallery of weather photographs from Reading.</p>',
	seo: { description: 'Weather photographs', opengraphDescription: 'OG photos' }
};

describe('photographs page load', () => {
	it('returns page data when the WordPress page exists', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: mockPage });

		const result = (await load({} as Parameters<typeof load>[0])) as PhotographsLoadResult;

		expect(result.page).toEqual(mockPage);
	});

	it('throws a 404 error when the page is not found', async () => {
		vi.mocked(fetchGraphQL).mockResolvedValueOnce({ page: null });

		await expect(load({} as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 404 });
	});
});
