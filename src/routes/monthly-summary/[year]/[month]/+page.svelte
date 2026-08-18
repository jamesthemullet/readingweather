<script lang="ts">
	import ShareButton from '$lib/components/ShareButton.svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const summary = $derived(data.summary);

	const postUrl = $derived(
		`https://www.readingweather.co.uk/monthly-summary/${summary.year}/${String(summary.month).padStart(2, '0')}`
	);
	const postTitle = $derived(`${summary.label} Weather Report Card`);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: `${summary.label} Weather Report Card`,
		description: summary.headline,
		url: postUrl,
		temporalCoverage: (() => {
			const year = summary.year;
			const month = String(summary.month).padStart(2, '0');
			const lastDay = new Date(year, summary.month, 0).getDate();
			return `${year}-${month}-01/${year}-${month}-${String(lastDay).padStart(2, '0')}`;
		})(),
		spatialCoverage: {
			'@type': 'Place',
			name: 'Reading, UK'
		},
		creator: {
			'@type': 'Organization',
			name: 'Reading Weather',
			url: 'https://www.readingweather.co.uk'
		}
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			timeZone: 'UTC'
		});
	}
</script>

<svelte:head>
	<title>{postTitle} | Reading Weather</title>
	<meta name="description" content={summary.headline} />
	<meta property="og:title" content={postTitle} />
	<meta property="og:description" content={summary.headline} />
	<meta property="og:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta property="og:image:alt" content="Monthly weather report card for Reading and Berkshire" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={postUrl} />
	<meta name="twitter:title" content={postTitle} />
	<meta name="twitter:description" content={summary.headline} />
	<meta name="twitter:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta name="twitter:image:alt" content="Monthly weather report card for Reading and Berkshire" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>{summary.label} Weather Report Card</h1>

<section class="monthly-summary-card">
	<p class="headline">{summary.headline}</p>

	<section class="stat-group">
		<h2>Temperature</h2>
		<p>
			High: <strong>{summary.temperature.high}°C</strong> · Low: <strong
				>{summary.temperature.low}°C</strong
			>
		</p>
		<p>
			Mean: <strong>{summary.temperature.mean}°C</strong> (average for {summary.monthName}: {summary
				.temperature.historicalAverageMean}°C)
		</p>
	</section>

	<section class="stat-group">
		<h2>Rainfall</h2>
		<p>
			Total: <strong>{summary.rainfall.total}mm</strong> (average: {summary.rainfall
				.historicalAverageTotal}mm)
		</p>
		<p>
			Wettest day: {formatDate(summary.rainfall.wettestDay.date)} ({summary.rainfall.wettestDay
				.value}mm)
		</p>
	</section>

	<section class="stat-group">
		<h2>Sunshine</h2>
		<p>
			Total: <strong>{summary.sunshine.totalHours}h</strong> (average: {summary.sunshine
				.historicalAverageHours}h)
		</p>
		<p>
			Sunniest day: {formatDate(summary.sunshine.sunniestDay.date)} ({summary.sunshine.sunniestDay
				.hours}h sun)
		</p>
	</section>

	{#if summary.condition || summary.streak}
		<section class="stat-group">
			<h2>The month at a glance</h2>
			{#if summary.condition}
				<p>Most common condition: <strong>{summary.condition.label}</strong></p>
			{/if}
			{#if summary.streak}
				<p>Longest streak: <strong>{summary.streak.label}</strong> <span aria-hidden="true">{summary.streak.emoji}</span></p>
			{/if}
		</section>
	{/if}

	<section class="stat-group">
		<h2>Notable days</h2>
		<p class="range">{summary.yearsOfData} years of records</p>
		<ul class="records">
			<li>
				<span aria-hidden="true">🌡️</span> Hottest day: <strong
					>{summary.records.hottestDay.value}°C</strong
				>
				— {formatDate(summary.records.hottestDay.date)}, {summary.records.hottestDay.year}
				{#if summary.records.hottestDay.year === summary.year}
					<span class="new-record">New record</span>
				{/if}
			</li>
			<li>
				<span aria-hidden="true">❄️</span> Coldest day: <strong
					>{summary.records.coldestDay.value}°C</strong
				>
				— {formatDate(summary.records.coldestDay.date)}, {summary.records.coldestDay.year}
				{#if summary.records.coldestDay.year === summary.year}
					<span class="new-record">New record</span>
				{/if}
			</li>
			<li>
				<span aria-hidden="true">🌧️</span> Wettest day: <strong
					>{summary.records.wettestDay.value}mm</strong
				>
				— {formatDate(summary.records.wettestDay.date)}, {summary.records.wettestDay.year}
				{#if summary.records.wettestDay.year === summary.year}
					<span class="new-record">New record</span>
				{/if}
			</li>
		</ul>
	</section>

	<p class="conditions-note">
		Weather conditions are sourced from ERA5 reanalysis data and should be treated as an
		approximate guide only
	</p>
</section>

<ShareButton {postUrl} {postTitle} postSummary={summary.headline} />

<p class="older-posts">
	<a href="/monthly-summary">Browse all monthly report cards</a>
</p>
