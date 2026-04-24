import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import GET_POSTS_BY_DAY from '$lib/graphql/queries/getPostsByDay';
import type { HistoricalPost } from '$lib/types';
import type { PageLoad } from './$types';

type PostsByDayResult = { posts: { nodes: HistoricalPost[] } };

const SITE_START_YEAR = 2020;

function getUKDate(): { year: number; month: number; day: number } {
	const now = new Date();
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/London',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric'
	}).formatToParts(now);

	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
	return { year: get('year'), month: get('month'), day: get('day') };
}

export const load: PageLoad = async () => {
	const { year: currentYear, month, day } = getUKDate();

	const yearsToCheck = Array.from(
		{ length: currentYear - SITE_START_YEAR },
		(_, i) => SITE_START_YEAR + i
	);

	const [posts, historicalResults] = await Promise.all([
		fetchGraphQL(ALL_POSTS_QUERY),
		Promise.all(
			yearsToCheck.map((year) =>
				fetchGraphQL<PostsByDayResult>(GET_POSTS_BY_DAY, { year, month, day }).catch(() => ({
					posts: { nodes: [] as HistoricalPost[] }
				}))
			)
		)
	]);

	const historicalPosts = historicalResults
		.flatMap((r) => r.posts.nodes)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const meta = {
		title: 'Weather Forecast For Reading & Berkshire',
		description:
			'Your local, human-written weather forecast – especially for people in Reading and the surrounding areas'
	};

	return { posts, historicalPosts, meta };
};
