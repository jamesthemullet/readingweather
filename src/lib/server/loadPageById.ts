import { error } from '@sveltejs/kit';
import { fetchGraphQL } from '$lib/graphql/api';
import GET_PAGE_BY_ID from '$lib/graphql/queries/getPageById';
import type { GetPageByIdResponse } from '$lib/types';

export function loadPageById(pageId: number) {
	return async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
		const response = await fetchGraphQL<GetPageByIdResponse>(GET_PAGE_BY_ID, { id: pageId }, fetch);

		if (!response.page) {
			throw error(404, 'Page not found');
		}

		return { page: response.page };
	};
}
