<script lang="ts">
	import { sanitize } from '$lib/sanitize';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	import '../../styles/index.css';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: data.page.title,
		description: data.page.seo.description,
		url: `https://www.readingweather.co.uk/${data.page.slug}`
	};
</script>

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.seo.description} />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.seo.opengraphDescription || data.page.seo.description} />
	<meta property="og:image" content={data.page.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
	<meta property="og:image:alt" content="Weather forecast illustration for Reading and Berkshire" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.page.slug}`} />
	<meta name="twitter:title" content={data.page.title} />
	<meta name="twitter:description" content={data.page.seo.opengraphDescription || data.page.seo.description} />
	<meta name="twitter:image" content={data.page.featuredImage?.node?.sourceUrl ?? 'https://www.readingweather.co.uk/images/weather.png'} />
	<meta name="twitter:image:alt" content="Weather forecast illustration for Reading and Berkshire" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

{#if data.page}
	<h1>{data.page.title}</h1>
	<article class="post">
		<div class="content">{@html sanitize(data.page.content)}</div>
	</article>
{/if}
