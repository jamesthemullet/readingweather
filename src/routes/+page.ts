import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import GET_LATEST_SEASONAL_POST_QUERY from '$lib/graphql/queries/getLatestSeasonalPost';
import type { AllPostsResponse, LatestSeasonalPostResponse } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [posts, latestSeasonalPost] = await Promise.all([
		fetchGraphQL<AllPostsResponse>(ALL_POSTS_QUERY),
		fetchGraphQL<LatestSeasonalPostResponse>(GET_LATEST_SEASONAL_POST_QUERY).catch(() => null)
	]);

	const meta = {
		title: 'Weather Forecast For Reading & Berkshire',
		description:
			'Your local, human-written weather forecast – especially for people in Reading and the surrounding areas'
	};

	return { posts, latestSeasonalPost: latestSeasonalPost?.posts?.nodes?.[0] ?? null, meta };
};
