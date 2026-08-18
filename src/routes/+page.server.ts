import { type DailyWeather, fetchHistoricalWeather } from '$lib/api/historicalWeather';
import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import GET_LATEST_SEASONAL_POST_QUERY from '$lib/graphql/queries/getLatestSeasonalPost';
import GET_POSTS_ON_THIS_DAY from '$lib/graphql/queries/getPostsOnThisDay';
import { getCache, setCache } from '$lib/server/cache';
import type { AllPostsResponse, LatestSeasonalPostResponse, OnThisDayResponse } from '$lib/types';
import type { PageServerLoad } from './$types';

const HISTORICAL_WEATHER_TTL_MS = 24 * 60 * 60 * 1000;

function lastCompletedMonth(now: Date): { year: number; month: number } {
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth() + 1;
	return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export const load: PageServerLoad = async ({ fetch }) => {
	const today = new Date();
	const month = today.getMonth() + 1;
	const day = today.getDate();

	const last = lastCompletedMonth(today);
	const lastMonthLabel = new Date(Date.UTC(last.year, last.month - 1, 1)).toLocaleDateString(
		'en-GB',
		{ month: 'long', year: 'numeric', timeZone: 'UTC' }
	);

	const historicalWeatherCacheKey = `historical-weather-${month}-${day}`;

	const [postsResult, latestSeasonalPost, onThisDay, historicalWeather] = await Promise.all([
		fetchGraphQL<AllPostsResponse>(ALL_POSTS_QUERY, {}, fetch).catch(() => null),
		fetchGraphQL<LatestSeasonalPostResponse>(GET_LATEST_SEASONAL_POST_QUERY, {}, fetch).catch(
			() => null
		),
		fetchGraphQL<OnThisDayResponse>(GET_POSTS_ON_THIS_DAY, { month, day }, fetch).catch(() => null),
		(async (): Promise<DailyWeather[] | null> => {
			const cached = getCache<DailyWeather[]>(historicalWeatherCacheKey);
			if (cached) return cached;
			const data = await fetchHistoricalWeather(month, day).catch(() => null);
			if (data) setCache(historicalWeatherCacheKey, data, HISTORICAL_WEATHER_TTL_MS);
			return data;
		})()
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
		lastMonth: { ...last, label: lastMonthLabel },
		meta
	};
};
