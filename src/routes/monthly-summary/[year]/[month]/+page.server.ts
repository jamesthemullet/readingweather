import { error } from '@sveltejs/kit';
import type { MonthlySummary } from '$lib/api/monthlySummary';
import { fetchGraphQL } from '$lib/graphql/api';
import GET_POSTS_BY_DATE from '$lib/graphql/queries/getPostsByDate';
import type { PageServerLoad } from './$types';

type RelatedPost = { title: string; slug: string; date: string };

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const year = Number(params.year);
	const month = Number(params.month);

	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw error(404, 'Monthly summary not found');
	}

	const response = await fetch(`/api/monthly-summary?year=${year}&month=${month}`);
	if (!response.ok) {
		if (response.status === 502) {
			throw error(503, 'This report is temporarily unavailable — please try again in a few minutes.');
		}
		throw error(404, 'Monthly summary not found');
	}

	const summary = (await response.json()) as MonthlySummary;

	// A page that loads successfully only ever describes a fully completed past
	// month, so its content never changes again once published.
	setHeaders({ 'cache-control': 'public, max-age=31536000, immutable' });

	// Related posts are a nice-to-have alongside the weather stats above, so a
	// WordPress outage shouldn't take down an otherwise-working report card.
	let relatedPosts: RelatedPost[] = [];
	try {
		const postsRes = await fetchGraphQL<{ posts: { nodes: RelatedPost[] } }>(
			GET_POSTS_BY_DATE,
			{ year, month },
			fetch
		);
		relatedPosts = postsRes.posts.nodes;
	} catch (err) {
		console.error('Failed to fetch related posts for monthly summary', err);
	}

	return { summary, relatedPosts };
};
