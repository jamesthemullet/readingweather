<script lang="ts">
	import type { PageProps } from '../about/$types';

	let { data }: PageProps = $props();

	import '../../styles/index.css';
</script>

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.seo.description} />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.seo.description} />
	<!-- <meta property="og:image" content="/default-image.png" /> -->
</svelte:head>

{#if data.page}
	<h1>{data.page.title}</h1>
	<article class="post">
		<div class="content">{@html data.page.content}</div>
	</article>
{/if}
