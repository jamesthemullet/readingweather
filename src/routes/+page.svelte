<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	import '../styles/index.css';
	import PostList from '$lib/components/PostList.svelte';

	function formatYear(dateString: string): string {
		return new Intl.DateTimeFormat('en-GB', {
			timeZone: 'Europe/London',
			year: 'numeric'
		}).format(new Date(dateString));
	}

	const todayFormatted = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/London',
		day: 'numeric',
		month: 'long'
	}).format(new Date());
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

{#if data.historicalPosts.length > 0}
	<section class="on-this-day">
		<h2>On this day in Reading Weather history</h2>
		<p class="on-this-day-intro">{todayFormatted} in previous years:</p>
		<ul class="on-this-day-list">
			{#each data.historicalPosts as post (post.slug)}
				<li>
					<span class="on-this-day-year">{formatYear(post.date)}</span>
					<a href="/{post.slug}">{post.title}</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<div class="older-posts">
	<p>Looking for older posts?</p>
	<a href="/archives">Check out the archives</a>
</div>
