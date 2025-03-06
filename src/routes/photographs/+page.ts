import { fetchGraphQL } from '$lib/graphql/api';
import GET_PAGE_BY_ID from '$lib/graphql/queries/getPageById';
import type { PageLoad } from '../about/$types';

export const load: PageLoad = async () => {
	const pageId = 169;
	const response = await fetchGraphQL(GET_PAGE_BY_ID, { id: pageId });

	return { page: response.page };
};
