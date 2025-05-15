import ADD_COMMENT from '$lib/graphql/queries/addComment';

export async function fetchGraphQL(query: string, variables = {}) {
	const response = await fetch('https://blog.readingweather.co.uk/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, variables })
	});

	const json = await response.json();

	if (!response.ok || json.errors) {
		throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
	}

	return json.data;
}

export async function addComment(
	postId: number,
	content: string,
	author: string,
	authorEmail: string,
	parentId: number | null = null
) {
	const variables = {
		input: {
			commentOn: postId,
			content,
			author,
			authorEmail,
			parent: parentId
		}
	};

	const response = await fetchGraphQL(ADD_COMMENT, variables);

	return response?.createComment
		? { success: true, comment: response.createComment.comment }
		: { success: false };
}
