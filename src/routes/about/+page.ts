import { error } from '@sveltejs/kit';
import { fetchGraphQL } from '$lib/graphql/api';
import GET_PAGE_BY_ID from '$lib/graphql/queries/getPageById';
import type { GetPageByIdResponse } from '$lib/types';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const pageId = 2;
	const response = await fetchGraphQL<GetPageByIdResponse>(GET_PAGE_BY_ID, { id: pageId }, fetch);

	if (!response.page) {
		throw error(404, 'Page not found');
	}

	return { page: response.page };
};
