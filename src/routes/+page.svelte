<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	import '../styles/index.css';
	import OnThisDay from '$lib/components/OnThisDay.svelte';
	import PostList from '$lib/components/PostList.svelte';
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<meta property="og:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/" />
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
