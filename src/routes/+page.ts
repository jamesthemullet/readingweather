import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const posts = await fetchGraphQL(ALL_POSTS_QUERY);
	return posts;
};
