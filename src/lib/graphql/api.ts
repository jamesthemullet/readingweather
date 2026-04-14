import ADD_COMMENT from '$lib/graphql/queries/addComment';

export async function fetchGraphQL(query: string, variables = {}) {
	const response = await fetch('https://blog.readingweather.co.uk/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, variables })
	});

	const json = await response.json();

	if (!response.ok || json.errors) {
		// Log full details server-side only; never expose schema internals to the client.
		console.error('GraphQL error', JSON.stringify(json.errors));
		throw new Error('Failed to fetch data');
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
