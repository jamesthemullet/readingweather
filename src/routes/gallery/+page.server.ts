import { fetchGraphQL } from '$lib/graphql/api';
import GET_POSTS_FOR_GALLERY from '$lib/graphql/queries/getPostsForGallery';
import { getCache, setCache } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const START_YEAR = 2020;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type MediaDetails = {
	width?: number;
	height?: number;
};

type GalleryPost = {
	title: string;
	slug: string;
	date: string;
	featuredImage?: { node?: { sourceUrl: string; mediaDetails?: MediaDetails } };
};

type GalleryPostFiltered = {
	title: string;
	slug: string;
	date: string;
	featuredImage: { node: { sourceUrl: string; mediaDetails?: MediaDetails } };
};

export type GalleryPostWithImage = GalleryPostFiltered & { name: string };

type GroupedMonth = {
	month: number;
	posts: GalleryPostWithImage[];
};

function getImageName(url: string): string {
	const filename = url.split('/').pop()?.split('?')[0] ?? '';
	const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
	return nameWithoutExt
		.split(/[-_\s]+/)
		.filter(
			(word) =>
				!/^\d+$/.test(word) &&
				!/^jpe?g$/i.test(word) &&
				!/^png$/i.test(word) &&
				!/^webp$/i.test(word)
		)
		.map((word) => word.replace(/\d+$/, ''))
		.filter((word) => word.length > 0)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

const generateYears = (): number[] => {
	const currentYear = new Date().getFullYear();
	const years: number[] = [];
	for (let year = currentYear; year >= START_YEAR; year--) {
		years.push(year);
	}
	return years;
};

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
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
			fetchGraphQL<{ posts: { nodes: GalleryPost[] } }>(
				GET_POSTS_FOR_GALLERY,
				{ year: selectedYear, month },
				fetch
			)
		)
	);

	const groupedPosts: GroupedMonth[] = monthResults
		.map((res, i) => {
			const month = i + 1;
			const posts = res.posts.nodes
				.filter((post): post is GalleryPostFiltered => {
					const sourceUrl = post.featuredImage?.node?.sourceUrl;
					if (!sourceUrl) return false;
					const filename = sourceUrl.split('/').pop() ?? '';
					return !/PXL/i.test(filename);
				})
				.map((post): GalleryPostWithImage => ({
					...post,
					name: getImageName(post.featuredImage.node.sourceUrl)
				}));
			return { month, posts };
		})
		.filter(({ posts }) => posts.length > 0)
		.sort((a, b) => b.month - a.month);

	setCache(cacheKey, groupedPosts, CACHE_TTL_MS);
	setHeaders({ 'cache-control': 'public, max-age=3600' });

	return { years, selectedYear, groupedPosts };
};
