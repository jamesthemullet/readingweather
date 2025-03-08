import { fetchGraphQL } from '../../lib/graphql/api';
import GET_POSTS_BY_DATE from '../../lib/graphql/queries/getPostsByDate';
import type { PageLoad } from '../$types';

const generateArchives = () => {
	const startYear = 2020;
	const currentDate = new Date();
	const archives = [];

	for (let year = startYear; year <= currentDate.getFullYear(); year++) {
		for (let month = 1; month <= 12; month++) {
			if (year === currentDate.getFullYear() && month > currentDate.getMonth() + 1) break; // Stop at the current month
			archives.push({ year, month });
		}
	}

	return archives.reverse(); // Latest first
};

export const load: PageLoad = async ({ url }) => {
	const selectedYear = Number(url.searchParams.get('year'));
	const selectedMonth = Number(url.searchParams.get('month'));

	const archives = generateArchives();

	let posts = [];
	if (selectedYear && selectedMonth) {
		const postsRes = await fetchGraphQL(GET_POSTS_BY_DATE, {
			year: selectedYear,
			month: selectedMonth
		});
		posts = postsRes.posts.nodes;
	}

	return {
		archives,
		selectedYear,
		selectedMonth,
		posts
	};
};
