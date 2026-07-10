export type GqlComment = {
	id: string;
	content: string;
	parentId: string | null;
	author: { node: { name: string } };
	date: string;
};

export type ThreadedComment = GqlComment & { replies: ThreadedComment[] };

export type GqlPostFeaturedImageNode = {
	altText?: string;
	sourceUrl: string;
	srcSet?: string;
	mediaDetails?: {
		width?: number;
		height?: number;
	};
};

export type GqlPostNode = {
	id: string;
	title: string;
	slug: string;
	excerpt?: string;
	date: string;
	content: string;
	featuredImage?: {
		node?: GqlPostFeaturedImageNode;
	};
	comments?: {
		nodes: GqlComment[];
	};
};

export type GqlPageSeo = {
	description: string;
	opengraphDescription: string;
};

export type GqlPageNode = {
	title: string;
	slug: string;
	content: string;
	seo: GqlPageSeo;
	featuredImage?: {
		node?: {
			sourceUrl: string;
		};
	};
};

export type AllPostsNode = {
	date: string;
	slug: string;
	title: string;
	content: string;
	featuredImage?: {
		node?: {
			sourceUrl: string;
			srcSet: string;
			mediaDetails?: { width?: number; height?: number };
		};
	};
};

export type AllPostsResponse = {
	posts: {
		nodes: Array<AllPostsNode>;
	};
};

export type GetPostBySlugResponse = {
	postBy: GqlPostNode | null;
};

export type GetLatestPostSlugResponse = {
	posts: {
		nodes: Array<{ slug: string }>;
	};
};

export type GetPageByIdResponse = {
	page: GqlPageNode | null;
};

export type SeasonalPostsResponse = {
	posts: {
		nodes: Array<{
			date: string;
			slug: string;
			title: string;
			content: string;
			featuredImage?: {
				node?: {
					sourceUrl: string;
					srcSet: string;
				};
			};
			comments?: {
				nodes: GqlComment[];
			};
		}>;
	};
};

export type LatestSeasonalPostResponse = {
	posts: {
		nodes: Array<{
			slug: string;
			title: string;
			date: string;
			featuredImage?: {
				node?: {
					sourceUrl: string;
					srcSet: string;
					mediaDetails?: { width?: number; height?: number };
				};
			};
		}>;
	};
};

export type OnThisDayResponse = {
	posts: {
		nodes: Array<{
			title: string;
			slug: string;
			date: string;
		}>;
	};
};
