import { fetchGraphQL } from '../../lib/graphql/api';
import GET_POSTS_FOR_GALLERY from '../../lib/graphql/queries/getPostsForGallery';
import { getCache, setCache } from '../../lib/server/cache';
import type { PageServerLoad } from './$types';

const START_YEAR = 2020;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type GalleryPost = {
	title: string;
	slug: string;
	date: string;
	featuredImage?: { node?: { sourceUrl: string } };
};

type GroupedMonth = {
	month: number;
	posts: GalleryPost[];
};

const generateYears = () => {
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let year = currentYear; year >= START_YEAR; year--) {
		years.push(year);
	}
	return years;
};

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const currentYear = new Date().getFullYear();
	const selectedYear = Number(url.searchParams.get('year')) || currentYear;
	const years = generateYears();

	const cacheKey = `gallery-${selectedYear}`;
	const cached = getCache<GroupedMonth[]>(cacheKey);

	if (cached) {
		setHeaders({ 'cache-control': 'public, max-age=3600' });
		return { years, selectedYear, groupedPosts: cached };
	}

	// Query each month in parallel to avoid the 100-post-per-year limit
	const currentDate = new Date();
	const lastMonth = selectedYear < currentDate.getFullYear() ? 12 : currentDate.getMonth() + 1;

	const monthResults = await Promise.all(
		Array.from({ length: lastMonth }, (_, i) => i + 1).map((month) =>
			fetchGraphQL(GET_POSTS_FOR_GALLERY, { year: selectedYear, month })
		)
	);

	const groupedPosts: GroupedMonth[] = monthResults
		.map((res, i) => {
			const month = i + 1;
			const posts = (res.posts.nodes as GalleryPost[]).filter((post) => {
				const sourceUrl = post.featuredImage?.node?.sourceUrl;
				if (!sourceUrl) return false;
				const filename = sourceUrl.split('/').pop() ?? '';
				return !/PXL/i.test(filename);
			});
			return { month, posts };
		})
		.filter(({ posts }) => posts.length > 0)
		.sort((a, b) => b.month - a.month);

	setCache(cacheKey, groupedPosts, CACHE_TTL_MS);
	setHeaders({ 'cache-control': 'public, max-age=3600' });

	return { years, selectedYear, groupedPosts };
};
