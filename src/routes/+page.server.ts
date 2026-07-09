import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import GET_LATEST_SEASONAL_POST_QUERY from '$lib/graphql/queries/getLatestSeasonalPost';
import GET_POSTS_ON_THIS_DAY from '$lib/graphql/queries/getPostsOnThisDay';
import type { AllPostsResponse, LatestSeasonalPostResponse, OnThisDayResponse } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const today = new Date();
	const month = today.getMonth() + 1;
	const day = today.getDate();

	const [postsResult, latestSeasonalPost, onThisDay] = await Promise.all([
		fetchGraphQL<AllPostsResponse>(ALL_POSTS_QUERY, {}, fetch).catch(() => null),
		fetchGraphQL<LatestSeasonalPostResponse>(GET_LATEST_SEASONAL_POST_QUERY, {}, fetch).catch(
			() => null
		),
		fetchGraphQL<OnThisDayResponse>(GET_POSTS_ON_THIS_DAY, { month, day }, fetch).catch(() => null)
	]);

	setHeaders({ 'cache-control': 'public, max-age=900, stale-while-revalidate=3600' });

	const meta = {
		title: 'Weather Forecast For Reading & Berkshire',
		description:
			'Your local, human-written weather forecast – especially for people in Reading and the surrounding areas'
	};

	const posts = postsResult ?? { posts: { nodes: [] } };

	return {
		posts,
		latestSeasonalPost: latestSeasonalPost?.posts?.nodes?.[0] ?? null,
		onThisDay,
		meta
	};
};
