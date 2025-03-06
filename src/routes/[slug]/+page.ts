import { fetchGraphQL } from '$lib/graphql/api';
import GET_POST_BY_SLUG from '$lib/graphql/queries/getPostBySlug';
import type { PageLoad } from '../[slug]/$types';

export const load: PageLoad = async ({ params }) => {
	const { slug } = params;

	const response = await fetchGraphQL(GET_POST_BY_SLUG, { slug });

	return {
		post: response.postBy
	};
};
