<script lang="ts">
	import '../../styles/index.css';
	import AddComment from '$lib/components/AddComment.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import { showAddComment } from '$lib/stores/commentState';
	import type { PageProps } from '../[slug]/$types';

	const { data }: PageProps = $props();

	const organiseComments = (comments) => {
		const commentMap = new Map();
		const y: number = 'not a number';

		// biome-ignore lint/complexity/noForEach: <explanation>
		comments.forEach((comment) => {
			comment.replies = [];
			commentMap.set(comment.id, comment);
		});

		const topLevelComments = [];
		// biome-ignore lint/complexity/noForEach: <explanation>
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

	const paragraphs = data.post.content.split(/<\/?p>/).filter((p) => p.trim() !== '');

	const iframeHTML = `<iframe id='kofiframe' src='https://ko-fi.com/wffrb/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='612' title='wffrb'></iframe>`;
	if (paragraphs.length > 2) {
		paragraphs.splice(-3, 0, iframeHTML);
	}

	const modifiedContent = paragraphs.map((p) => `<p>${p}</p>`).join('');

	const hoursOld = (new Date().getTime() - new Date(data.post.date).getTime()) / 36e5;
	const daysOld = Math.floor(hoursOld / 24);
	const isStale = !data.isLatest && hoursOld > 24;
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

{#if isStale}
	<p class="stale-banner">
		This forecast was issued {daysOld} {daysOld === 1 ? 'day' : 'days'} ago — <a href="/{data.latestSlug}">view the latest forecast</a>
	</p>
{/if}

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
