<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<meta property="og:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
</svelte:head>

<h1>Weather Forecast For Reading & Berkshire</h1>

<ul>
	{#each data.posts.posts.nodes as post}
		<li>
			<a href="/blog/{post.slug}">
				{post.title}
			</a>
		</li>
	{/each}
</ul>
