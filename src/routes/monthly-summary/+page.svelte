<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const monthlySummaryDescription =
		"Browse monthly weather report cards for Reading, comparing each month's temperature, rainfall and sunshine against the historical average.";

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Monthly Weather Report Cards',
		description: monthlySummaryDescription,
		url: 'https://www.readingweather.co.uk/monthly-summary',
		isPartOf: { '@type': 'WebSite', name: 'Reading Weather', url: 'https://www.readingweather.co.uk' }
	};

	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
</script>

<svelte:head>
	<title>Monthly Weather Report Cards | Reading Weather</title>
	<meta name="description" content={monthlySummaryDescription} />
	<meta property="og:title" content="Monthly Weather Report Cards | Reading Weather" />
	<meta property="og:description" content={monthlySummaryDescription} />
	<meta property="og:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta
		property="og:image:alt"
		content="Reading Weather – weather forecasts for Reading and Berkshire"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/monthly-summary" />
	<meta name="twitter:title" content="Monthly Weather Report Cards | Reading Weather" />
	<meta name="twitter:description" content={monthlySummaryDescription} />
	<meta name="twitter:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta
		name="twitter:image:alt"
		content="Reading Weather – weather forecasts for Reading and Berkshire"
	/>
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>Monthly Weather Report Cards</h1>

<ul class="monthly-summary-index">
	{#each data.months as { year, month } (`${year}-${month}`)}
		<li>
			<a href="/monthly-summary/{year}/{String(month).padStart(2, '0')}">
				{MONTH_NAMES[month - 1]} {year}
			</a>
		</li>
	{/each}
</ul>
