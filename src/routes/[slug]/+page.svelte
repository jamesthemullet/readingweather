<script lang="ts">
	import type { PageProps } from '../[slug]/$types';

	let { data }: PageProps = $props();

	import '../../styles/index.css';
	import Comments from '$lib/components/Comments.svelte';

	const organiseComments = (comments) => {
		const commentMap = new Map();

		// Store all comments in a map by ID
		comments.forEach((comment) => {
			comment.replies = [];
			commentMap.set(comment.id, comment);
		});

		// Attach replies to their parent comments
		const topLevelComments = [];
		comments.forEach((comment) => {
			if (comment.parentId) {
				const parent = commentMap.get(comment.parentId);
				if (parent) {
					parent.replies.push(comment);
				}
			} else {
				topLevelComments.push(comment);
			}
		});

		return topLevelComments;
	};

	const threadedComments = organiseComments(data.post.comments.nodes);
</script>

<svelte:head>
	<title>{data.post.title}</title>
</svelte:head>

<h1>{data.post.title}</h1>
<article class="post">
	{#if data.post.featuredImage?.node?.sourceUrl}
		<img src={data.post.featuredImage.node.sourceUrl} alt={data.post.title} />
	{/if}
	<div class="content">{@html data.post.content}</div>

	<Comments {threadedComments} />
</article>
