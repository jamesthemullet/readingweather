export interface GqlComment {
	id: string;
	content: string;
	parentId: string | null;
	author: { node: { name: string } };
	date: string;
}

export type ThreadedComment = GqlComment & { replies: ThreadedComment[] };

export interface HistoricalPost {
	title: string;
	slug: string;
	date: string;
}
