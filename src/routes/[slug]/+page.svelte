<script lang="ts">
	import type { PageProps } from '../[slug]/$types';

	let { data }: PageProps = $props();

	import '../../styles/index.css';
</script>

<svelte:head>
	<title>{data.post.title}</title>
</svelte:head>

<h1>{data.post.title}</h1>
<article class="post">
	{#if data.post.featuredImage?.node?.sourceUrl}
		<img src={data.post.featuredImage.node.sourceUrl} alt={data.post.title} />
	{/if}
	<div class="content">{@html data.post.content}</div>
</article>
