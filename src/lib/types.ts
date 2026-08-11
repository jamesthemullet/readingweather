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
	opengraphDescription: string | null;
};

export type GqlPageNode = {
	title: string;
	slug: string;
	content: string;
	seo: GqlPageSeo;
	featuredImage?: {
		node?: {
			sourceUrl: string;
			altText?: string;
		};
	};
};

// Shared shape for featured image nodes returned by list/feed queries.
export type PostFeaturedImageListNode = {
	sourceUrl: string;
	srcSet: string;
	altText?: string;
	mediaDetails?: { width?: number; height?: number };
};

export type AllPostsNode = {
	date: string;
	slug: string;
	title: string;
	content: string;
	featuredImage?: {
		node?: PostFeaturedImageListNode;
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

// Seasonal forecast posts share the same query shape as AllPostsNode.
export type SeasonalPostsResponse = {
	posts: {
		nodes: Array<AllPostsNode>;
	};
};

export type LatestSeasonalPost = {
	slug: string;
	title: string;
	date: string;
	featuredImage?: {
		node?: PostFeaturedImageListNode;
	};
};

export type LatestSeasonalPostResponse = {
	posts: {
		nodes: Array<LatestSeasonalPost>;
	};
};

export type OnThisDayPost = {
	title: string;
	slug: string;
	date: string;
};

export type OnThisDayResponse = {
	posts: {
		nodes: Array<OnThisDayPost>;
	};
};
