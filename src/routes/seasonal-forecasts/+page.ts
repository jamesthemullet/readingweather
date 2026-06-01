import { fetchGraphQL } from '$lib/graphql/api';
import ALL_SEASONAL_POSTS_QUERY from '$lib/graphql/queries/allSeasonalPosts';
import type { SeasonalPostsResponse } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const posts = await fetchGraphQL<SeasonalPostsResponse>(ALL_SEASONAL_POSTS_QUERY);

	return { posts };
};
