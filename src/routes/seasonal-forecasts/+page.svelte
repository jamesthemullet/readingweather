<script lang="ts">
	import PostList from '$lib/components/PostList.svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	import '../../styles/index.css';
</script>

<svelte:head>
	<title>Seasonal Forecasts – Reading Weather</title>
	<meta name="description" content="Long-range seasonal weather forecasts for Reading and Berkshire, covering spring, summer, autumn, and winter outlooks for the coming months." />
	<meta property="og:title" content="Seasonal Forecasts – Reading Weather" />
	<meta property="og:description" content="Long-range seasonal weather forecasts for Reading and Berkshire, covering spring, summer, autumn, and winter outlooks for the coming months." />
	<meta property="og:image" content={data.posts.posts.nodes[0]?.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/seasonal-forecasts" />
	<meta name="twitter:title" content="Seasonal Forecasts – Reading Weather" />
	<meta name="twitter:description" content="Long-range seasonal weather forecasts for Reading and Berkshire, covering spring, summer, autumn, and winter outlooks for the coming months." />
	<meta name="twitter:image" content={data.posts.posts.nodes[0]?.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
</svelte:head>

<h1>Seasonal Forecasts</h1>

<PostList posts={data.posts.posts.nodes} />
