<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	import '../styles/index.css';
	import OnThisDay from '$lib/components/OnThisDay.svelte';
	import PostList from '$lib/components/PostList.svelte';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Reading Weather',
		description: data.meta.description,
		url: 'https://www.readingweather.co.uk'
	};
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<meta property="og:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
	<meta property="og:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta name="twitter:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>Weather Forecast For Reading & Berkshire</h1>

<PostList posts={data.posts.posts.nodes} />

{#if data.onThisDay?.posts?.nodes?.length}
	<OnThisDay posts={data.onThisDay.posts.nodes} />
{/if}

<div class="older-posts">
	<p>Looking for older posts?</p>
	<a href="/archives">Check out the archives</a>
</div>
