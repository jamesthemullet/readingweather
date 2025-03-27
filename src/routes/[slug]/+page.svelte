<script lang="ts">
	import type { PageProps } from '../[slug]/$types';
	import { showAddComment } from '$lib/stores/commentState';

	let { data }: PageProps = $props();

	import '../../styles/index.css';
	import Comments from '$lib/components/Comments.svelte';
	import AddComment from '$lib/components/AddComment.svelte';

	const organiseComments = (comments) => {
		const commentMap = new Map();

		comments.forEach((comment) => {
			comment.replies = [];
			commentMap.set(comment.id, comment);
		});

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

	let paragraphs = data.post.content.split(/<\/?p>/).filter((p) => p.trim() !== '');

	const iframeHTML = `<iframe id='kofiframe' src='https://ko-fi.com/wffrb/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='612' title='wffrb'></iframe>`;
	if (paragraphs.length > 2) {
		paragraphs.splice(-3, 0, iframeHTML);
	}

	const modifiedContent = paragraphs.map((p) => `<p>${p}</p>`).join('');
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
	<div class="content">{@html modifiedContent}</div>

	<Comments {threadedComments} {postId} />
	{#if $showAddComment}
		<AddComment {postId} />
	{/if}
</article>
