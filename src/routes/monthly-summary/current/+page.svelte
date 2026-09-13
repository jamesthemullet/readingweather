<script lang="ts">
	import ShareButton from '$lib/components/ShareButton.svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const progress = $derived(data.progress);

	const postUrl = "https://www.readingweather.co.uk/monthly-summary/current";
	const postTitle = $derived(`${progress.label} so far`);

	function signed(actual: number, historical: number, unit: string): string {
		const diff = Math.round((actual - historical) * 10) / 10;
		if (diff === 0) return "right on the historic average";
		const direction = diff > 0 ? 'above' : 'below';
		return `${Math.abs(diff)}${unit} ${direction} the historic average`;
	}
</script>

<svelte:head>
	<title>{postTitle} | Reading Weather</title>
	<meta name="description" content={progress.headline} />
	<meta property="og:title" content={postTitle} />
	<meta property="og:description" content={progress.headline} />
	<meta property="og:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta property="og:image:alt" content="Live month-in-progress weather comparison for Reading and Berkshire" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={postUrl} />
	<meta name="twitter:title" content={postTitle} />
	<meta name="twitter:description" content={progress.headline} />
	<meta name="twitter:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta name="twitter:image:alt" content="Live month-in-progress weather comparison for Reading and Berkshire" />
</svelte:head>

<h1>{progress.label} — Month in Progress</h1>

<section class="monthly-summary-card">
	<p class="headline">{progress.headline}</p>

	<p class="range">
		Day {progress.daysElapsed} of {progress.daysInMonth} · {progress.daysRemaining} day{progress.daysRemaining ===
		1
			? ''
			: 's'} to go · data as of {progress.asOfDate}
	</p>

	<section class="stat-group">
		<h2>Temperature so far</h2>
		<p>
			Mean: <strong>{progress.temperature.meanSoFar}°C</strong> vs
			<strong>{progress.temperature.historicalAverageMeanSoFar}°C</strong> historic mean-to-date
			({signed(progress.temperature.meanSoFar, progress.temperature.historicalAverageMeanSoFar, '°C')})
		</p>
		<p>
			Projected month mean: <strong>{progress.temperature.projectedMean}°C</strong> if the rest of the
			month tracks the historic average
		</p>
	</section>

	<section class="stat-group">
		<h2>Rainfall so far</h2>
		<p>
			Total: <strong>{progress.rainfall.totalSoFar}mm</strong> vs
			<strong>{progress.rainfall.historicalAverageTotalSoFar}mm</strong> historic total-to-date
			({signed(progress.rainfall.totalSoFar, progress.rainfall.historicalAverageTotalSoFar, 'mm')})
		</p>
		<p>
			On track for <strong>{progress.rainfall.projectedTotal}mm</strong> this month — the
			<strong>{progress.rainfall.projectedRankLabel}</strong>
			{progress.monthName} in Reading since 1940, if the rest of the month plays out like average
		</p>
	</section>

	<section class="stat-group">
		<h2>Sunshine so far</h2>
		<p>
			Total: <strong>{progress.sunshine.totalHoursSoFar}h</strong> vs
			<strong>{progress.sunshine.historicalAverageHoursSoFar}h</strong> historic total-to-date
			({signed(progress.sunshine.totalHoursSoFar, progress.sunshine.historicalAverageHoursSoFar, 'h')})
		</p>
		<p>Projected month total: <strong>{progress.sunshine.projectedHours}h</strong></p>
	</section>

	<p class="conditions-note">
		Weather conditions are sourced from ERA5 reanalysis data and should be treated as an
		approximate guide only. Projections assume the rest of the month tracks the historic average
		and are not a forecast.
	</p>
</section>

<ShareButton {postUrl} {postTitle} postSummary={progress.headline} />

<p class="older-posts">
	<a href="/monthly-summary">Browse all monthly report cards</a>
</p>
