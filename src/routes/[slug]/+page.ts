import { error } from '@sveltejs/kit';
import { fetchGraphQL } from '$lib/graphql/api';
import GET_POST_BY_SLUG from '$lib/graphql/queries/getPostBySlug';
import type { GetPostBySlugResponse } from '$lib/types';
import type { PageLoad } from '../[slug]/$types';

export const load: PageLoad = async ({ params }) => {
	const { slug } = params;

	const response = await fetchGraphQL<GetPostBySlugResponse>(GET_POST_BY_SLUG, { slug });

	if (!response.postBy) {
		throw error(404, 'Post not found');
	}

	const latestSlug = response.posts?.nodes?.[0]?.slug;

	return {
		post: response.postBy,
		isLatest: latestSlug === slug,
		latestSlug
	};
};
