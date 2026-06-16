import { error } from '@sveltejs/kit';
import { fetchGraphQL } from '$lib/graphql/api';
import GET_LATEST_POST_SLUG from '$lib/graphql/queries/getLatestPostSlug';
import GET_POST_BY_SLUG from '$lib/graphql/queries/getPostBySlug';
import { getCache, setCache } from '$lib/server/cache';
import type { GetLatestPostSlugResponse, GetPostBySlugResponse } from '$lib/types';
import type { PageServerLoad } from './$types';

const LATEST_SLUG_CACHE_KEY = 'latest-post-slug';
const LATEST_SLUG_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchLatestPostSlug(): Promise<string | undefined> {
	const cached = getCache<string>(LATEST_SLUG_CACHE_KEY);
	if (cached) return cached;

	const data = await fetchGraphQL<GetLatestPostSlugResponse>(GET_LATEST_POST_SLUG);
	const slug = data.posts?.nodes?.[0]?.slug;
	if (slug) setCache(LATEST_SLUG_CACHE_KEY, slug, LATEST_SLUG_TTL_MS);
	return slug;
}

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	const [response, latestSlug] = await Promise.all([
		fetchGraphQL<GetPostBySlugResponse>(GET_POST_BY_SLUG, { slug }),
		fetchLatestPostSlug()
	]);

	if (!response.postBy) {
		throw error(404, 'Post not found');
	}

	return {
		post: response.postBy,
		isLatest: latestSlug === slug,
		latestSlug
	};
};
