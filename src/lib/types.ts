export interface GqlComment {
	id: string;
	content: string;
	parentId: string | null;
	author: { node: { name: string } };
	date: string;
}

export type ThreadedComment = GqlComment & { replies: ThreadedComment[] };

export interface GqlPostFeaturedImageNode {
	sourceUrl: string;
	srcSet?: string;
	mediaDetails?: {
		width?: number;
		height?: number;
	};
}

export interface GqlPostNode {
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
}

export interface GqlPageSeo {
	description: string;
	opengraphDescription: string;
}

export interface GqlPageNode {
	title: string;
	slug: string;
	content: string;
	seo: GqlPageSeo;
	featuredImage?: {
		node?: {
			sourceUrl: string;
		};
	};
}

export interface AllPostsResponse {
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
					mediaDetails?: { width?: number; height?: number };
				};
			};
		}>;
	};
}

export interface GetPostBySlugResponse {
	posts: {
		nodes: Array<{ slug: string }>;
	};
	postBy: GqlPostNode | null;
}

export interface GetPageByIdResponse {
	page: GqlPageNode | null;
}

export interface SeasonalPostsResponse {
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
}

export interface OnThisDayResponse {
	posts: {
		nodes: Array<{
			title: string;
			slug: string;
			date: string;
		}>;
	};
}
