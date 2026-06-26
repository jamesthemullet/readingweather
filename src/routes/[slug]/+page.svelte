<script lang="ts">
	import '../../styles/index.css';
	import AddComment from '$lib/components/AddComment.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { injectKofiWidget } from '$lib/kofi';
	import { sanitize } from '$lib/sanitize';
	import { showAddComment } from '$lib/stores/commentState';
	import type { GqlComment, ThreadedComment } from '$lib/types';
	import type { PageProps } from '../[slug]/$types';

	const { data }: PageProps = $props();

	const organiseComments = (comments: GqlComment[]): ThreadedComment[] => {
		const threaded: ThreadedComment[] = comments.map((c) => ({ ...c, replies: [] }));
		const commentMap = new Map<string, ThreadedComment>(threaded.map((c) => [c.id, c]));
		for (const comment of threaded) {
			commentMap.set(comment.id, comment);
		}

		const topLevelComments: ThreadedComment[] = [];
		for (const comment of threaded) {
			if (comment.parentId) {
				const parent = commentMap.get(comment.parentId);
				if (parent) {
					parent.replies.push(comment);
				}
			} else {
				topLevelComments.push(comment);
			}
		}

		return topLevelComments;
	};

	const threadedComments = $derived(organiseComments(data.post.comments?.nodes ?? []));
	const postId = $derived(data.post.id);

	const postDescription = $derived(
		data.post.excerpt || `Weather Forecast For Reading & Berkshire, issued ${data.post.title}`
	);
	const postTitle = $derived(
		`Weather Forecast For Reading & Berkshire, issued ${data.post.title}`
	);
	const postUrl = $derived(`https://www.readingweather.co.uk/${data.post.slug}`);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: postTitle,
		description: postDescription,
		url: postUrl,
		...(data.post.date ? { datePublished: data.post.date } : {}),
		...(data.post.featuredImage?.node?.sourceUrl
			? { image: data.post.featuredImage.node.sourceUrl }
			: {}),
		author: {
			'@type': 'Organization',
			name: 'Reading Weather',
			url: 'https://www.readingweather.co.uk'
		},
		publisher: {
			'@type': 'Organization',
			name: 'Reading Weather',
			url: 'https://www.readingweather.co.uk'
		}
	});

	const decodeHtmlEntities = (str: string): string =>
		str
			.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
			.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&nbsp;/g, ' ');

	const postSummary = $derived.by(() => {
		const paragraphs = data.post.content.split(/<\/?p>/).filter((p) => p.trim() !== '');
		const firstParagraphText = decodeHtmlEntities(
			(paragraphs[0] ?? '').replace(/<[^>]*>/g, '').trim()
		);
		const firstSentenceMatch = firstParagraphText.match(/^.*?[.!?]/);
		return firstSentenceMatch ? firstSentenceMatch[0].trim() : firstParagraphText;
	});

	const modifiedContent = $derived(injectKofiWidget(data.post.content));

	const hoursOld = $derived((Date.now() - new Date(data.post.date).getTime()) / 36e5);
	const daysOld = $derived(Math.floor(hoursOld / 24));
	const isStale = $derived(!data.isLatest && hoursOld > 24);
</script>

<svelte:head>
	<title>{postTitle}</title>
	<meta name="description" content={postDescription} />
	<meta property="og:title" content={postTitle} />
	<meta property="og:description" content={postDescription} />
	{#if data.post.featuredImage?.node?.sourceUrl}
		<meta property="og:image" content={data.post.featuredImage.node.sourceUrl} />
		<meta name="twitter:image" content={data.post.featuredImage.node.sourceUrl} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={postUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={postTitle} />
	<meta name="twitter:description" content={postDescription} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>{data.post.title}</h1>

{#if isStale}
	<p class="stale-banner">
		This forecast was issued {daysOld} {daysOld === 1 ? 'day' : 'days'} ago — <a href="/{data.latestSlug}">view the latest forecast</a>
	</p>
{/if}

<article class="post">
	{#if data.post.featuredImage?.node?.sourceUrl}
		<img
			src={data.post.featuredImage.node.sourceUrl}
			srcset={data.post.featuredImage.node.srcSet}
			sizes="(min-width: 768px) 700px, 100vw"
			alt=""
			width={data.post.featuredImage.node.mediaDetails?.width ?? undefined}
			height={data.post.featuredImage.node.mediaDetails?.height ?? undefined}
			loading="lazy"
		/>
	{/if}
	<div class="content">{@html sanitize(modifiedContent)}</div>

	<ShareButton {postUrl} {postTitle} {postSummary} />

	<Comments {threadedComments} {postId} />
	{#if $showAddComment}
		<AddComment {postId} />
	{/if}
</article>

{#if data.latestSeasonalPost}
	<section class="latest-seasonal">
		<h2>Latest Seasonal Forecast</h2>
		<a href="/{data.latestSeasonalPost.slug}">{data.latestSeasonalPost.title}</a>
	</section>
{/if}
