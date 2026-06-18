<script lang="ts">
	import PostList from '$lib/components/PostList.svelte';
	import type { PageProps } from '../$types';

	const { data }: PageProps = $props();

	import '../../styles/index.css';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Seasonal Forecasts – Reading Weather',
		description: 'Seasonal forecasts for Reading & Berkshire.',
		url: 'https://www.readingweather.co.uk/seasonal-forecasts'
	};
</script>

<svelte:head>
	<title>Seasonal Forecasts – Reading Weather</title>
	<meta name="description" content="Seasonal forecasts for Reading & Berkshire." />
	<meta property="og:title" content="Seasonal Forecasts – Reading Weather" />
	<meta property="og:description" content="Seasonal forecasts for Reading & Berkshire." />
	<meta property="og:image" content={data.posts.posts.nodes[0]?.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/seasonal-forecasts" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>Seasonal Forecasts</h1>

<PostList posts={data.posts.posts.nodes} />
