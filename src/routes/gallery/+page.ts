import { fetchGraphQL } from '../../lib/graphql/api';
import GET_POSTS_FOR_GALLERY from '../../lib/graphql/queries/getPostsForGallery';
import type { PageLoad } from '../$types';

const START_YEAR = 2020;

const generateYears = () => {
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let year = currentYear; year >= START_YEAR; year--) {
		years.push(year);
	}
	return years;
};

export const load: PageLoad = async ({ url }) => {
	const currentYear = new Date().getFullYear();
	const selectedYear = Number(url.searchParams.get('year')) || currentYear;
	const years = generateYears();

	// Query each month in parallel to avoid the 100-post-per-year limit
	const currentDate = new Date();
	const lastMonth =
		selectedYear < currentDate.getFullYear() ? 12 : currentDate.getMonth() + 1;

	const monthResults = await Promise.all(
		Array.from({ length: lastMonth }, (_, i) => i + 1).map((month) =>
			fetchGraphQL(GET_POSTS_FOR_GALLERY, { year: selectedYear, month })
		)
	);

	// Build grouped posts, filtering out posts without images or with PXL filenames
	const groupedPosts = monthResults
		.map((res, i) => {
			const month = i + 1;
			const posts = (res.posts.nodes as Array<{
				title: string;
				slug: string;
				date: string;
				featuredImage?: { node?: { sourceUrl: string } };
			}>).filter((post) => {
				const sourceUrl = post.featuredImage?.node?.sourceUrl;
				if (!sourceUrl) return false;
				const filename = sourceUrl.split('/').pop() ?? '';
				return !/PXL/i.test(filename);
			});
			return { month, posts };
		})
		.filter(({ posts }) => posts.length > 0)
		.sort((a, b) => b.month - a.month);

	return {
		years,
		selectedYear,
		groupedPosts
	};
};
