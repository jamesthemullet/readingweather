<script lang="ts">
	import type { PageProps } from '../about/$types';
	import DOMPurify from 'dompurify';

	let { data }: PageProps = $props();

	import '../../styles/index.css';

	const sanitizedContent = DOMPurify.sanitize(data.page.content);
</script>

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.seo.description} />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.seo.description} />
	{#if data.page.featuredImage?.node?.sourceUrl}
		<meta property="og:image" content={data.page.featuredImage.node.sourceUrl} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.page.slug}`} />
</svelte:head>

{#if data.page}
	<h1>{data.page.title}</h1>
	<article class="post">
		<div class="content">{@html sanitizedContent}</div>
	</article>
{/if}
