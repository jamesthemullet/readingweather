import type { DailyWeather } from '$lib/api/historicalWeather';
import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import GET_LATEST_SEASONAL_POST_QUERY from '$lib/graphql/queries/getLatestSeasonalPost';
import GET_POSTS_ON_THIS_DAY from '$lib/graphql/queries/getPostsOnThisDay';
import type { AllPostsResponse, LatestSeasonalPostResponse, OnThisDayResponse } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const today = new Date();
	const month = today.getMonth() + 1;
	const day = today.getDate();

	const [postsResult, latestSeasonalPost, onThisDay, historicalWeather] = await Promise.all([
		fetchGraphQL<AllPostsResponse>(ALL_POSTS_QUERY).catch(() => null),
		fetchGraphQL<LatestSeasonalPostResponse>(GET_LATEST_SEASONAL_POST_QUERY).catch(() => null),
		fetchGraphQL<OnThisDayResponse>(GET_POSTS_ON_THIS_DAY, { month, day }).catch(() => null),
		fetch(`/api/historical-weather?month=${month}&day=${day}`)
			.then((r) => (r.ok ? (r.json() as Promise<DailyWeather[]>) : null))
			.catch(() => null)
	]);

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
		historicalWeather,
		meta
	};
};
