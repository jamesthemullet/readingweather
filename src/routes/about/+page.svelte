<script lang="ts">
	
	import { sanitize } from '$lib/sanitize';
import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.seo.description} />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.seo.opengraphDescription || data.page.seo.description} />
	<meta property="og:image" content={data.page.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.page.slug}`} />
	<meta name="twitter:title" content={data.page.title} />
	<meta name="twitter:description" content={data.page.seo.opengraphDescription || data.page.seo.description} />
	<meta name="twitter:image" content={data.page.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
</svelte:head>

{#if data.page}
	<h1>{data.page.title}</h1>
	<article class="post">
		<div class="content">{@html sanitize(data.page.content)}</div>
	</article>
{/if}
