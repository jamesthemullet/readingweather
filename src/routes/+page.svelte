<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	import '../styles/index.css';
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
		<li class="post">
			<a href="/blog/{post.slug}">
				{#if post.featuredImage?.node?.sourceUrl}
					<img
						src={post.featuredImage.node.sourceUrl}
						srcset={post.featuredImage.node.srcSet}
						alt={post.title}
						width="200"
						height="auto"
					/>
				{/if}
				<h2>{post.title}</h2>
			</a>
		</li>
		<div class="content">{@html post.content}</div>
	{/each}
</ul>
