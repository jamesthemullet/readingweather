import { fetchGraphQL } from '$lib/graphql/api';
import ALL_SEASONAL_POSTS_QUERY from '$lib/graphql/queries/allSeasonalPosts';
import type { SeasonalPostsResponse } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const posts = await fetchGraphQL<SeasonalPostsResponse>(ALL_SEASONAL_POSTS_QUERY, {}, fetch);
	return { posts };
};
