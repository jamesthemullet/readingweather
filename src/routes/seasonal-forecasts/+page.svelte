<script lang="ts">
	import PostList from '$lib/components/PostList.svelte';
	import type { PageProps } from '../$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Seasonal Forecasts</title>
	<meta name="description" content="Seasonal forecasts for Reading & Berkshire." />
	<meta property="og:title" content="Seasonal Forecasts" />
	<meta property="og:description" content="Seasonal forecasts for Reading & Berkshire." />
	<!-- <meta property="og:image" content="/default-image.png" /> -->
</svelte:head>

<h1>Seasonal Forecasts</h1>

<PostList posts={data.posts.posts.nodes} />
