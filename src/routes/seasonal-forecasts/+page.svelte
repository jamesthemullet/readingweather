<script lang="ts">
	import PostList from '$lib/components/PostList.svelte';
	import type { PageProps } from '../$types';

	const { data }: PageProps = $props();

	import '../../styles/index.css';
</script>

<svelte:head>
	<title>Seasonal Forecasts</title>
	<meta name="description" content="Seasonal forecasts for Reading & Berkshire." />
	<meta property="og:title" content="Seasonal Forecasts" />
	<meta property="og:description" content="Seasonal forecasts for Reading & Berkshire." />
	{#if data.posts.featuredImage?.node?.sourceUrl}
		<meta property="og:image" content={data.posts.featuredImage.node.sourceUrl} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.posts.slug}`} />
</svelte:head>

<h1>Seasonal Forecasts</h1>

<PostList posts={data.posts.posts.nodes} />
