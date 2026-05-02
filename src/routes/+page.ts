import { fetchGraphQL } from '$lib/graphql/api';
import ALL_POSTS_QUERY from '$lib/graphql/queries/allPosts';
import GET_POSTS_ON_THIS_DAY from '$lib/graphql/queries/getPostsOnThisDay';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const today = new Date();
	const month = today.getMonth() + 1;
	const day = today.getDate();

	const [posts, onThisDay] = await Promise.all([
		fetchGraphQL(ALL_POSTS_QUERY),
		fetchGraphQL(GET_POSTS_ON_THIS_DAY, { month, day }).catch(() => null)
	]);

	const meta = {
		title: 'Weather Forecast For Reading & Berkshire',
		description:
			'Your local, human-written weather forecast – especially for people in Reading and the surrounding areas'
	};

	return { posts, onThisDay, meta };
};
