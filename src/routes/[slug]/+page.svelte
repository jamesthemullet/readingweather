<script lang="ts">
	import type { PageProps } from '../[slug]/$types';

	let { data }: PageProps = $props();

	import '../../styles/index.css';
	import Comments from '$lib/components/Comments.svelte';
	import AddComment from '$lib/components/AddComment.svelte';

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
	const postId = data.post.id;
</script>

<svelte:head>
	<title>Weather Forecast For Reading & Berkshire, issued {data.post.title}</title>
	<meta
		name="description"
		content={data.post.excerpt ||
			`Weather Forecast For Reading & Berkshire, issued {data.post.title}`}
	/>
	<meta
		property="og:title"
		content={`Weather Forecast For Reading & Berkshire, issued {data.post.title}`}
	/>
	<meta
		property="og:description"
		content={data.post.excerpt ||
			`Weather Forecast For Reading & Berkshire, issued {data.post.title}`}
	/>
	{#if data.post.featuredImage?.node?.sourceUrl}
		<meta property="og:image" content={data.post.featuredImage.node.sourceUrl} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.post.slug}`} />
</svelte:head>

<h1>{data.post.title}</h1>
<article class="post">
	{#if data.post.featuredImage?.node?.sourceUrl}
		<img src={data.post.featuredImage.node.sourceUrl} alt={data.post.title} />
	{/if}
	<div class="content">{@html data.post.content}</div>

	<Comments {threadedComments} {postId} />
	<AddComment {postId} />
</article>
